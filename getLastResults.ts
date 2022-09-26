import axios from "axios";

const LAST_RESULTS_API_URL = "https://blaze.com/api/roulette_games/recent";

export const getLastResults = async (): Promise<number[]> => {
  let lastResults: number[] = [];

  const { data } = await axios.get(LAST_RESULTS_API_URL);
  for (let result of data) {
    lastResults.push(result["color"]);
  }
  
  return lastResults;
}

interface RecenteRoulet{
  "id":string,
  "created_at":Date,
  "color":number,
  "roll":number,
  "server_seed":string,
}
interface LastResults {
  lastColors: number[],
  lastTime: Date;
}
export async function getLastData(): Promise<LastResults> {
  let lastColors: number[] = [];

  const { data } = await axios.get<RecenteRoulet[]>(LAST_RESULTS_API_URL);
  for (let result of data) {
    lastColors.push(result.color);
  }
  
  return {lastColors, lastTime: new Date(data[0].created_at)};
}
