import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { CouplesService } from './couples.service';

@Controller('couples')
export class CouplesController {
  constructor(private couplesService: CouplesService) {}

  @Post('generate')
  async generateCode(@Body('userId') userId: string) {
    return this.couplesService.generateCode(userId);
  }

  @Post('join')
  async join(@Body('userId') userId: string, @Body('code') code: string) {
    return this.couplesService.join(userId, code);
  }

  @Get('status')
  async getStatus(@Request() req: any) {
    // Note: Assuming some auth middleware attaches user. Normally req.user.id
    // For now taking from query or body if needed, but using userId for consistency with other methods
    return this.couplesService.getStatus(req.query.userId);
  }
}
