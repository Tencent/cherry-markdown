import { Test, TestingModule } from '@nestjs/testing';
import { PublishController } from './publish.controller';
import { PublishService } from './publish.service';

describe('PublishController', () => {
  let controller: PublishController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublishController],
      providers: [PublishService],
    }).compile();

    controller = module.get<PublishController>(PublishController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
