import { HTTPResponse, Protocol } from "puppeteer";
import * as fs from "fs";
import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import recaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { addSeconds, differenceInMilliseconds } from "date-fns"
import databaseJson from "./database.json";
import { COLOR, getHeader, getWallets, Header, rouletBet } from "./bet";
import { getLastData } from "./getLastResults";
import { isBefore } from "date-fns";
import * as dotenv from "dotenv";
dotenv.config()

puppeteer.use(stealthPlugin());

const BLAZE_LOGIN_URL =
  "https://blaze.com/pt/?modal=auth&tab=login&redirect=/pt/account/profile/info";

interface Auth {
  bearer: string;
  cookie: string;
  x_client_version: string;
}
async function login(email: string, password: string): Promise<Header> {
  
  puppeteer.use(recaptchaPlugin({
    provider: { id: '2captcha', token: 'd6ea9cecd0470cf9ab713416a5a6b456'}
  }));

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--start-maximized"],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(0);
  let headers: Auth;

  let tempHeader;

  async function verifyAndGetBearer(response: HTTPResponse): Promise<boolean> {
    if (response.url().endsWith("password")) {
      if (response.ok()) {
        const json = await response.json();
        const { "x-client-version": x_client_version } = response
          .request()
          .headers();

        tempHeader = response.request().headers();

        headers = {
          cookie: "",
          x_client_version,
          bearer: json.access_token,
        };

        return true;
      }

      return true; // throw new Error('Falha no login'); // updateDoc()
    }

    return false;
  }

  await page.goto(BLAZE_LOGIN_URL);

  await page.type('[type="text"]', email);
  await page.type('[type="password"]', password);

  await page.click("#auth-modal > div.body > form > div.input-footer > button");

  const awaitResponse = page.waitForResponse((response: any) => verifyAndGetBearer(response));
  const data = await page.solveRecaptchas();
  await awaitResponse;
  console.log({data})
  const formatCookie = (cookies: Protocol.Network.Cookie[]): string => {
    // _ga=GA1.2.969804894.1663976249; _gid=GA1.2.586791366.1663976249; _gat=1; __zlcmid=1C6lFWSN3BCies7
    let foo = "";
    cookies.forEach((val, key) => {
      foo += `${val.name}=${val.value}; `;
    });

    return foo.trim();
  };

  headers!.cookie = formatCookie(await page.cookies());
  console.log(headers!);

  await browser.close();

  return getHeader(headers!.bearer, headers!.cookie, tempHeader);
}

async function verifyAuthAndGetBalance(header: Header) {
  const [{ id, balance }] = await getWallets(
    header
  );
  return { walletId: id, balance: parseFloat(balance) }
}

async function bet(header: Header,
  walletId: number,
  entry: number,
  whiteEntry: number,
  color: COLOR,
  lastTime: Date) {

  await awaitToTime(lastTime)
  let bets = [];
  let a_res = await rouletBet(header, {
    amount: entry.toString(),
    color: color,
    wallet_id: walletId,
    currency_type: "BRL",
    free_bet: false,
  });
  bets.push(a_res)
  if (whiteEntry !== 0) {
    let b_res = await rouletBet(header, {
      amount: whiteEntry.toString(),
      color: COLOR.WHITE,
      wallet_id: walletId,
      currency_type: "BRL",
      free_bet: false,
    });
    bets.push(b_res)
  }

  return bets;
}
async function awaitToTime(last: Date, toFinished: boolean = false) {
  const now = new Date()
  const end = addSeconds(last, 60)
  const endBet = addSeconds(last, 45)
  const start = addSeconds(last, 30)
  let ms = differenceInMilliseconds(now, start);
  const initiated = isBefore(start, now)
  const finished = isBefore(endBet, now);
  console.log({ms, last, start, endBet, now, end, toFinished})
  if (toFinished) {
    ms = differenceInMilliseconds(end, now);
  } else {
    if (initiated && !finished) {
      return;
    }
    if (finished) {
      throw new Error("Perdemos sinal")
    }
  }
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
  console.log(new Date())
}

async function updateHeader(email: string, password: string) {
  const header = await login(email, password);
  fs.writeFileSync('database.json', JSON.stringify({ header }));
  return header;
}

async function init() {
  const email = process.env.EMAIL!;
  const password = process.env.PASSWORD!;
  let header: Header;
  let data: {
    walletId: number;
    balance: number;
  }
  if (typeof databaseJson.header === "string") {
    header = await updateHeader(email, password);
    data = await verifyAuthAndGetBalance(header);
  } else {
    header = databaseJson.header as unknown as Header;
    try {
      data = await verifyAuthAndGetBalance(header);
    } catch (error) {
      header = await updateHeader(email, password);
      header = databaseJson.header as unknown as Header;
      data = await verifyAuthAndGetBalance(header);
    }
  }

  const saldoInicial = data.balance
  const resultadoInicial = await getLastData();
  const apostas = await bet(header, data.walletId, 1.7, 0, COLOR.BLACK, resultadoInicial.lastTime);
  data = await verifyAuthAndGetBalance(header);
  const saldoTemporario = console.log({ balance: data.balance })
  await awaitToTime(resultadoInicial.lastTime, true);
  const resultadoFinal = await getLastData();
  data = await verifyAuthAndGetBalance(header);
  const saldoFinal =  data.balance;
  const log = {
    saldoInicial,
    resultadoInicial,
    apostas,
    saldoTemporario,
    resultadoFinal,
    saldoFinal,
  }
  console.log({log: JSON.stringify(log, null, 2)});
}

init()


