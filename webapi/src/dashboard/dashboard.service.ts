import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobOrder } from '../database/entities/job-order.entity';
import { Application } from '../database/entities/application.entity';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/entities/user-role.entity';
import { Company } from '../database/entities/company.entity';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(
        @InjectRepository(JobOrder)
        private jobOrderRepo: Repository<JobOrder>,
        @InjectRepository(Application)
        private applicationRepo: Repository<Application>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Company)
        private companyRepo: Repository<Company>,
    ) {}

    /** Admin dashboard — system-wide KPIs */
    async getAdminDashboard() {
        const [
            totalUsers,
            totalCompanies,
            totalJobOrders,
            totalApplications,
            openJobOrders,
            pendingDecisions,
            recentApplications,
        ] = await Promise.all([
            this.userRepo.count(),
            this.companyRepo.count(),
            this.jobOrderRepo.count(),
            this.applicationRepo.count(),
            this.jobOrderRepo.count({ where: { status: 'active' } }),
            this.applicationRepo.count({ where: { status: 'offer' } }),
            this.applicationRepo.find({
                order: { createdAt: 'DESC' },
                take: 5,
                relations: ['candidate', 'jobOrder'],
            }),
        ]);

        this.logger.log(`getAdminDashboard → users=${totalUsers} companies=${totalCompanies} jobOrders=${totalJobOrders} applications=${totalApplications}`);
        return {
            totalUsers,
            totalCompanies,
            totalJobOrders,
            totalApplications,
            openJobOrders,
            pendingDecisions,
            recentApplications,
        };
    }

    /** Recruiter dashboard — all job orders and applications */
    async getRecruiterDashboard(recruiterId: string) {
        const [
            myJobOrders,
            myApplications,
            pendingInterviews,
            awaitingDecision,
            recentApplications,
        ] = await Promise.all([
            this.jobOrderRepo.count(),
            this.applicationRepo.count(),
            this.applicationRepo.count({ where: { status: 'interview' } }),
            this.applicationRepo.count({ where: { status: 'offer' } }),
            this.applicationRepo.find({
                order: { createdAt: 'DESC' },
                take: 5,
                relations: ['candidate', 'jobOrder'],
            }),
        ]);

        this.logger.log(`getRecruiterDashboard recruiterId=${recruiterId} → jobOrders=${myJobOrders} applications=${myApplications}`);
        return {
            myJobOrders,
            myApplications,
            pendingInterviews,
            awaitingDecision,
            recentApplications,
        };
    }

    /** Client dashboard — scoped to their company's job orders */
    async getClientDashboard(companyIds: string[]) {
        if (!companyIds.length) {
            return {
                activeOrders: 0,
                candidatesInReview: 0,
                pendingDecisions: 0,
                recentCandidates: [],
            };
        }

        const [
            activeOrders,
            candidatesInReview,
            pendingDecisions,
            recentCandidates,
        ] = await Promise.all([
            this.jobOrderRepo
                .createQueryBuilder('jo')
                .where('jo.companyId IN (:...cids)', { cids: companyIds })
                .andWhere('jo.status = :status', { status: 'active' })
                .getCount(),
            this.applicationRepo
                .createQueryBuilder('app')
                .leftJoin('app.jobOrder', 'jo')
                .where('jo.companyId IN (:...cids)', { cids: companyIds })
                .andWhere('app.status = :s', { s: 'interview' })
                .getCount(),
            this.applicationRepo
                .createQueryBuilder('app')
                .leftJoin('app.jobOrder', 'jo')
                .where('jo.companyId IN (:...cids)', { cids: companyIds })
                .andWhere('app.status = :s', { s: 'offer' })
                .andWhere('app.clientDecisionType IS NULL')
                .getCount(),
            this.applicationRepo
                .createQueryBuilder('app')
                .leftJoin('app.jobOrder', 'jo')
                .leftJoinAndSelect('app.candidate', 'candidate')
                .leftJoinAndSelect('app.jobOrder', 'jobOrder')
                .where('jo.companyId IN (:...cids)', { cids: companyIds })
                .orderBy('app.createdAt', 'DESC')
                .limit(5)
                .getMany(),
        ]);

        this.logger.log(`getClientDashboard companyIds=[${companyIds}] → activeOrders=${activeOrders} pendingDecisions=${pendingDecisions}`);
        return {
            activeOrders,
            candidatesInReview,
            pendingDecisions,
            recentCandidates,
        };
    }
}
