import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PublishModule } from '@publish/publish.module';
import loadConfig from '@common/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
    }),
    PublishModule,
  ],
})
export class AppModule {}
