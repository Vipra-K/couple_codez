import { Module } from '@nestjs/common';
import { CouplesController } from './couples.controller';
import { CouplesService } from './couples.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CouplesController],
  providers: [CouplesService],
})
export class CouplesModule {}
