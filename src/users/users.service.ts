import { Inject, Injectable } from '@nestjs/common';
import { PG_CONNECTION } from '../constants';
import { Pool, QueryResult } from 'pg';
import {
  CheckCodeResult,
  CreateQueryResult,
  UserCheckEmail,
  UserCheckExists,
  UserForPasswordCheck,
  UserRegistration,
} from './types';
import { getHashPassword } from './hashPassword';
import * as crypto from 'node:crypto';
import { Cron } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class UsersService {
  constructor(
    @Inject(PG_CONNECTION) private conn: Pool,
    private MailService: MailService,
  ) {}

  async findUserByEmail(email: string): Promise<UserForPasswordCheck> {
    const res: QueryResult<UserForPasswordCheck> = await this.conn.query(
      'SELECT email, id, password  FROM users WHERE email = $1',
      [email],
    );
    return res.rows[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const res: QueryResult<any> = await this.conn.query(
      'Delete FROM users WHERE id = $1',
      [id],
    );
    await this.conn.query('Delete FROM refresh_tokens WHERE user_id = $1', [
      id,
    ]);
    return res.rowCount !== 0;
  }

  async createUser(user: UserRegistration): Promise<number | null> {
    await this.checkExists(user.email, user.tel);

    let res: QueryResult<CreateQueryResult>;
    const hashPassword: string = await getHashPassword(user.password);
    try {
      res = await this.conn.query(
        'INSERT INTO users (email, password, first_name, last_name, birth_date, role, status, phone_number, middle_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
        [
          user.email,
          hashPassword,
          user.first_name,
          user.last_name,
          user.birth_date,
          'student',
          'active',
          user.tel ?? null,
          user.middle_name ?? null,
        ],
      );
    } catch (e) {
      throw new Error(`wrong user insert: ${e}`);
    }
    const userId: number = res?.rows[0]?.id;
    if (userId) {
      return userId;
    } else {
      return null;
    }
  }

  async checkExists(email: string, phone?: string | null): Promise<boolean> {
    let checkRes: QueryResult<UserCheckExists>;
    let selectQuery: string = 'SELECT email FROM users WHERE email = $1';
    const paramsArray = [email];

    if (phone) {
      selectQuery =
        'SELECT email, phone_number FROM users WHERE email = $1 OR phone_number = $2';
      paramsArray.push(phone);
    }
    try {
      checkRes = await this.conn.query(selectQuery, paramsArray);
      if (checkRes.rows.length > 0) {
        const existing = checkRes.rows[0];
        if (existing.email === email) {
          throw new Error('Email already exists');
        }
        if (existing.phone_number === phone) {
          throw new Error('Phone number already exists');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      throw new Error(`Failed to check user existence: ${error}`);
    }
    return checkRes.rows.length === 0;
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    let res: { exists: boolean } = {
      exists: true,
    };
    try {
      const checkRes: QueryResult<UserCheckEmail> = await this.conn.query(
        'SELECT email FROM users WHERE email = $1',
        [email],
      );
      if (checkRes.rows.length === 0) {
        res = { exists: false };
      }
      return res;
    } catch (error) {
      throw new Error(`Failed to check user existence: ${error}`);
    }
  }

  async updateLastLogin(userId: number): Promise<boolean> {
    try {
      const updateRes = await this.conn.query(
        `UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1;`,
        [userId],
      );
      return updateRes?.rowCount === 1;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async sendCode(email: string): Promise<boolean> {
    const isExistsInUsers: { exists: boolean } =
      await this.checkEmailExists(email);
    if (isExistsInUsers.exists) return false;
    let verificationCode: string = crypto.randomInt(10000).toString();
    const lessSymbols: number = 4 - verificationCode.length;
    if (lessSymbols !== 0) {
      let additionalZeros: string = '';
      for (let i = 0; lessSymbols > i; i++) {
        additionalZeros += '0';
      }
      verificationCode = additionalZeros + verificationCode;
    }
    let isSuccessfulAdded: boolean = false;
    try {
      await this.conn.query(
        `INSERT INTO verification_codes (email, code, valid_until, attempt_count)
            VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '15 minutes', 0)
            ON CONFLICT (email) DO UPDATE
            SET code = EXCLUDED.code,
            valid_until = EXCLUDED.valid_until,
            attempt_count = EXCLUDED.attempt_count;
                  `,
        [email, verificationCode],
      );
      isSuccessfulAdded = true;
    } catch (e) {
      console.log(e);
      return false;
    }
    if (!isSuccessfulAdded) return false;
    // try {
    //   await this.MailService.transporter.sendMail({
    //     from: 'magic.collection.ru@gmail.com',
    //     // to: email,
    //     to: 'demonstration6v@gmail.com',
    //     subject: 'verification code',
    //     text: `Your verification code is ${verificationCode}`,
    //     html: `<!DOCTYPE html>
    // <html>
    // <head>
    //     <meta charset="UTF-8">
    //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //     <title>Верификация почты</title>
    //     <style>
    //         body {
    //             font-family: Arial, sans-serif;
    //             background-color: #f4f4f4;
    //             padding: 20px;
    //         }
    //         .container {
    //             max-width: 400px;
    //             background: #ffffff;
    //             padding: 20px;
    //             margin: 0 auto;
    //             border-radius: 8px;
    //             box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    //             text-align: center;
    //         }
    //         .code {
    //             font-size: 24px;
    //             font-weight: bold;
    //             color: #333;
    //             margin: 20px 0;
    //         }
    //         .footer {
    //             margin-top: 20px;
    //             font-size: 14px;
    //             color: #777;
    //         }
    //     </style>
    // </head>
    // <body>
    //     <div class="container">
    //         <h2>Подтверждение почты</h2>
    //         <p>Ваш код верификации:</p>
    //         <p class="code">${verificationCode}</p>
    //         <p class="footer">Этот код действителен в течение 15 минут.</p>
    //     </div>
    // </body>
    // </html>
    // `,
    //   });
    // } catch (e) {
    //   console.log(e);
    //   return false;
    // }
    return true;
  }

  async checkCode(
    email: string,
    codeToCheck: string,
  ): Promise<CheckCodeResult> {
    try {
      const verificationLine: QueryResult<{
        code: string;
        valid_until: string;
        attempt_count: number;
      }> = await this.conn.query(
        'SELECT code, valid_until, attempt_count FROM verification_codes WHERE email=$1 ',
        [email],
      );
      if (verificationLine.rowCount === 0) {
        return {
          isCorrect: false,
          reason: 'noCodeBD',
        };
      }
      const { code, valid_until, attempt_count } = verificationLine.rows[0];
      const correctDateUntil = new Date(valid_until.replace(' ', 'T') + 'Z');
      if (correctDateUntil.getTime() < Date.now()) {
        this.deleteVerificationCode(email);
        return {
          isCorrect: false,
          reason: 'time',
        };
      }
      if (attempt_count >= 3) {
        this.deleteVerificationCode(email);
        return {
          isCorrect: false,
          reason: 'attemptsOver',
        };
      }
      if (code !== codeToCheck) {
        this.attemptIncrease(email);
        return {
          isCorrect: false,
          reason: 'notCorrectCode',
        };
      }
    } catch (e) {
      console.log(e);
      return {
        isCorrect: false,
        reason: 'serverError',
      };
    }
    return {
      isCorrect: true,
    };
  }

  async attemptIncrease(email: string): Promise<boolean> {
    try {
      await this.conn.query(
        'UPDATE verification_codes SET attempt_count = attempt_count + 1 WHERE email=$1',
        [email],
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteVerificationCode(email: string): Promise<boolean> {
    try {
      await this.conn.query('DELETE FROM verification_codes WHERE email=$1', [
        email,
      ]);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  // каждый час.
  @Cron('0 0 * * * *')
  async deleteNotValidCodes() {
    try {
      await this.conn.query(
        'DELETE FROM verification_codes WHERE valid_until < NOW()',
      );
    } catch (e) {
      console.log(e);
    }
  }
}
