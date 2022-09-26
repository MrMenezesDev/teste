import axios from "axios";

const BET_API_URL = "https://blaze.com/api/roulette_bets";

export enum COLOR {
  BLACK = 2,
  RED = 1,
  WHITE = 0,
}

interface RouletteBetsParam {
  amount: string; //'0.46',
  currency_type: string; //'BRL';
  color: COLOR;
  free_bet: boolean;
  wallet_id: number;
}

interface Wallet {
  id: number; // 52928978,
  primary: boolean; // true,
  balance: string; // "0.4590",
  bonus_balance: string; // "0.0000",
  real_balance: string; // "0.4590",
  currency_type: string; // "BRL",
  deposit_currency: {
    type: string; // null,
    name: string; // null,
    symbol: string; // null
  };
  currency: {
    type: string; // "BRL",
    name: string; // "Brazilian Real",
    symbol: string; // "R$",
    fiat: boolean; // true
  };
}

export async function getWallets(headers: Header): Promise<Wallet[]> {
  try {
    const response = await axios.get("https://blaze.com/api/wallets", {
      headers: {
        ...headers,
      },
    });

    return response.data;
  } catch (error) {
    console.log(error);

    throw error;
  }
}

export interface Header {
  authority: string; // 'blaze.com',
  accept: string; // 'application/json, text/plain, */*',
  "accept-language": string; // 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  authorization: string; // 'Bearer ',
  "content-type": string; // 'application/json;charset=UTF-8',
  cookie: string; // '__zlcmid=; _ga_7Q8ZMQJCT2=GS1.1..1.1.1662729983.0.0.0; =GA1.2.250519200.1661982891; _gid=.2.1601792738.1663763439; 1',
  origin: string; // 'https://blaze.com',
  referer: string; // 'https://blaze.com/pt/games/double',
  "sec-ch-ua": string; // '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
  "sec-ch-ua-mobile": string; // '?0',
  "sec-ch-ua-platform": string; // '"Windows"',
  "sec-fetch-dest": string; // 'empty',
  "sec-fetch-mode": string; // 'cors',
  "sec-fetch-site": string; // 'same-origin',
  "user-agent": string; // 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
  "x-api-key": string; // 'undefined',
  "x-client-language": string; // 'pt',
  "x-client-version": string; // '93840be26'
}

export function getHeader(
  bearer: string,
  cookie: string,
  tempHeader: any
): Header {
  return {
    ...tempHeader,
    authorization: `Bearer ${bearer}`,
    cookie,
    "origin": "https://blaze.com",
    "referer": "https://blaze.com/pt/games/double",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "authority": "blaze.com"
  };
}



export async function rouletBet(
  headers: Header,
  data: RouletteBetsParam
): Promise<any> {
  try {
    const response = await axios.post<RouletteBetsParam, any>(
      BET_API_URL,
      data,
      { headers: { ...headers } }
    );

    return response.data;
  } catch (error: any) {
    console.log(error.response.data);

    throw error;
  }
}

export async function login(
  headers: Header,
  data: {username: string, password: string}
): Promise<any> {
  try {
    const  response = await axios.put(
      'https://blaze.com/api/auth/password',
      data,      
      { headers: { ...headers } }
    );

    return response.data;
  } catch (error: any) {
    console.log(error.response.data);

    throw error;
  }
}