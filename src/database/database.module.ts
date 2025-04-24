import { Module } from '@nestjs/common';
import { PG_CONNECTION } from '../constants';
import { Pool, types } from 'pg';
import { ConfigService } from '@nestjs/config';

const dbProvider = {
  provide: PG_CONNECTION,
  useFactory: (configService: ConfigService) => {
    types.setTypeParser(1114, (stringValue: string) => {
      return stringValue;
    });
    const pool = new Pool({
      user: configService.get<string>('PG_USER'),
      password: configService.get<string>('PG_PASSWORD'),
      port: configService.get<number>('PG_PORT'),
      database: configService.get<string>('PG_DATABASE'),
      host: configService.get<string>('PG_HOST'),
    });
    pool.on('connect', async (client) => {
      await client.query("SET TIME ZONE 'UTC'");
    });
    return pool;
  },
  inject: [ConfigService],
};

@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DatabaseModule {}
