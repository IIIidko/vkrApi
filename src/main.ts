import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as process from 'node:process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: { credentials: true, origin: 'http://localhost:5000' },
  });

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser(process.env['COOKIE_SECRET']));

  const config = new DocumentBuilder()
    .setTitle('Magic-collection')
    .setDescription('The magic-collection API description')
    .setVersion('1.0')
    .addTag('magic-collection')
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false });
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
