import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruiterController } from './recruiter.controller';
import { JobOrdersModule } from '../job-orders/job-orders.module';
import { ApplicationsModule } from '../applications/applications.module';
import { AdminModule } from '../admin/admin.module';
import { ReportsModule } from '../reports/reports.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { Candidate } from '../database/entities/candidate.entity';
import { CandidateSkill } from '../database/entities/candidate-skill.entity';
import { CandidateWorkExperience } from '../database/entities/candidate-work-experience.entity';
import { CandidateEducation } from '../database/entities/candidate-education.entity';
import { User } from '../database/entities/user.entity';
import { Application } from '../database/entities/application.entity';
import { JobOrder } from '../database/entities/job-order.entity';
import { CandidateProfileService } from './candidate-profile.service';

@Module({
    imports: [
        JobOrdersModule,
        ApplicationsModule,
        AdminModule,
        ReportsModule,
        DashboardModule,
        TypeOrmModule.forFeature([
            Candidate,
            CandidateSkill,
            CandidateWorkExperience,
            CandidateEducation,
            User,
            Application,
            JobOrder,
        ]),
    ],
    controllers: [RecruiterController],
    providers: [CandidateProfileService],
})
export class RecruiterModule {}
