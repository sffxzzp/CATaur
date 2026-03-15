import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateController } from './candidate.controller';
import { JobOrdersModule } from '../job-orders/job-orders.module';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';
import { CandidateResumeService } from './candidate-resume.service';
import { Candidate } from '../database/entities/candidate.entity';
import { ResumeParser } from '../database/entities/resume-parser.entity';
import { User } from '../database/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        JobOrdersModule,
        ApplicationsModule,
        NotificationsModule,
        UsersModule,
        TypeOrmModule.forFeature([Candidate, ResumeParser, User]),
    ],
    controllers: [CandidateController],
    providers: [CandidateResumeService],
    exports: [CandidateResumeService],
})
export class CandidateModule {}
