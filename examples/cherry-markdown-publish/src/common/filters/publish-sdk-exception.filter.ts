import { ResultDto } from '@common/dto/result.dto';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { type FastifyReply as Response } from 'fastify';

@Catch(HttpException)
export class PublishSdkExceptionFilter implements ExceptionFilter {
  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const failMsg =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : JSON.stringify(exceptionResponse);
    await response.status(200).send(ResultDto.fail(status, failMsg, null));
  }
}
