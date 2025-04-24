import * as bcrypt from 'bcrypt';

export async function getHashRefresh(refreshToken: string): Promise<string> {
  let hashRefresh: string;
  try {
    const saltRounds: number = 10;
    hashRefresh = await bcrypt?.hash(refreshToken, saltRounds);
    return hashRefresh;
  } catch (e) {
    throw new Error(e);
  }
}

export async function checkRefresh(
  refresh: string,
  refreshDB: string,
): Promise<boolean> {
  try {
    return await bcrypt?.compare(refresh, refreshDB);
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
