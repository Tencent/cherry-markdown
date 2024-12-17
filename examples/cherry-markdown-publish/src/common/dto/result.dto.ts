import { ApiProperty } from '@nestjs/swagger';

// 通用的返回数据格式
export class ResultDto<T = any> {
  @ApiProperty({ description: '状态码', example: 0, type: Number })
  public readonly code: number; // 状态码

  @ApiProperty({ description: '状态信息', example: '操作成功', type: String })
  public readonly msg: string; // 消息

  @ApiProperty({ description: '返回数据' })
  public readonly data?: T; // 数据

  constructor(code: number, msg: string, data?: T) {
    this.code = code;
    this.msg = msg;
    this.data = data;
  }

  static ok<T = any>(data?: T, msg = '操作成功', code = 0): ResultDto<T> {
    return new ResultDto<T>(code, msg, data);
  }

  static fail<T = any>(code = 1, msg = '操作失败', data?: T): ResultDto<T> {
    return new ResultDto<T>(code, msg, data);
  }
}
