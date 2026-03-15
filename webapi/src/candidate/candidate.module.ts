import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateController } from './candidate.controller';
import { JobOrdersModule } from '../job-orders/job-orders.module';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';
import { CandidateResumeService } from './candidate-resume.service';
import { CandidateAssistantService } from './candidate-assistant.service';
import { Candidate } from '../database/entities/candidate.entity';
import { CandidateSkill } from '../database/entities/candidate-skill.entity';
import { CandidateWorkExperience } from '../database/entities/candidate-work-experience.entity';
import { CandidateEducation } from '../database/entities/candidate-education.entity';
import { ResumeParser } from '../database/entities/resume-parser.entity';
import { User } from '../database/entities/user.entity';
import { Application } from '../database/entities/application.entity';
import { JobOrder } from '../database/entities/job-order.entity';
import { CandidateProfileService } from '../recruiter/candidate-profile.service';
import { AiModule } from '../ai/ai.module';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [
        JobOrdersModule,
        ApplicationsModule,
        UsersModule,
        AiModule,
        AdminModule,
        TypeOrmModule.forFeature([
            Candidate,
            CandidateSkill,
            CandidateWorkExperience,
            CandidateEducation,
            ResumeParser,
            User,
            Application,
            JobOrder,
        ]),
    ],
    controllers: [CandidateController],
    providers: [CandidateResumeService, CandidateProfileService, CandidateAssistantService],
    exports: [CandidateResumeService],
})
export class CandidateModule {}
