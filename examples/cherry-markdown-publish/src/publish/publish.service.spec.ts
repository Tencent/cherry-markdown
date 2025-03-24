import { Test, TestingModule } from '@nestjs/testing';
import { PublishService } from './publish.service';

describe('PublishService', () => {
  let service: PublishService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublishService],
    }).compile();

    service = module.get<PublishService>(PublishService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
