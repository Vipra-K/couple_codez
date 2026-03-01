import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
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
    return this.couplesService.getStatus(req.query.userId);
  }

  @Get('themes/templates')
  async getTemplates() {
    return this.couplesService.getTemplates();
  }

  @Post(':id/theme')
  async updateTheme(
    @Param('id') coupleId: string,
    @Body('templateId') templateId: string,
  ) {
    return this.couplesService.updateTheme(coupleId, templateId);
  }
}
