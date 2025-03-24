import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

const bodyLimit = 10 * 1024 * 1024; // 10MiB

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit }),
    { cors: true },
  );
  app.useGlobalPipes(new ValidationPipe());
  const swaggerOptions = new DocumentBuilder()
    .setTitle('Online-Chat Api Document')
    .setDescription('The Online-Chat Api Document')
    .setVersion('1.0')
    .build();

  const config = app.get(ConfigService);
  const prefix = config.get<string>('app.prefix') ?? '/';
  app.setGlobalPrefix(prefix);

  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup(`${prefix}docs`, app, document, {
    customSiteTitle: 'Cherry Markdown Publish Service Api Document',
  });
  await app.listen(config.get<number>('app.port') ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
