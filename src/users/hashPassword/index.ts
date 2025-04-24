import * as bcrypt from 'bcrypt';

export async function getHashPassword(password: string): Promise<string> {
  let hashPassword: string;
  try {
    const saltRounds: number = 10;
    hashPassword = await bcrypt?.hash(password, saltRounds);
    return hashPassword;
  } catch (e) {
    throw new Error(e);
  }
}

export async function checkPassword(
  password: string,
  passwordDB: string,
): Promise<boolean> {
  try {
    return await bcrypt?.compare(password, passwordDB);
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
