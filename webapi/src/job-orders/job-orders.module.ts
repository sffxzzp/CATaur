import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobOrder } from '../database/entities/job-order.entity';
import { User } from '../database/entities/user.entity';
import { JobOrdersService } from './job-orders.service';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [TypeOrmModule.forFeature([JobOrder, User]), CommonModule],
    providers: [JobOrdersService],
    exports: [JobOrdersService],
})
export class JobOrdersModule {}
