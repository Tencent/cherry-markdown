import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PublishService } from './publish.service';
import { PublishController } from './publish.controller';
import { PublishSdkContainer } from './sdk';

@Module({
  imports: [ConfigModule],
  controllers: [PublishController],
  providers: [PublishService, PublishSdkContainer],
})
export class PublishModule {}
