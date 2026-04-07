import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobOrder } from '../database/entities/job-order.entity';
import { Application, ClientDecisionType } from '../database/entities/application.entity';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/entities/user-role.entity';
import { Company } from '../database/entities/company.entity';
import { ClientDashboardResponseDto } from './dto/client-dashboard-response.dto';

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
    ) { }

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
    async getClientDashboard(companyIds: string[]): Promise<ClientDashboardResponseDto> {
        if (!companyIds.length) {
            return {
                activeOrders: 0,
                totalCandidates: 0,
                pendingDecisions: 0,
                offersInProgress: 0,
                recentCandidates: [],
                myDecisions: [],
                myJobOrders: [],
            };
        }

        const [
            activeOrders,
            totalCandidates,
            pendingDecisions,
            offersInProgress,
            recentCandidates,
            decisionRows,
            myJobOrderRows,
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
                .getCount(),
            this.applicationRepo
                .createQueryBuilder('app')
                .leftJoin('app.jobOrder', 'jo')
                .where('jo.companyId IN (:...cids)', { cids: companyIds })
                .andWhere('app.status = :s', { s: 'interview' })
                .andWhere('app.clientDecisionType IS NULL')
                .getCount(),
            this.applicationRepo
                .createQueryBuilder('app')
                .leftJoin('app.jobOrder', 'jo')
                .where('jo.companyId IN (:...cids)', { cids: companyIds })
                .andWhere('app.status = :s', { s: 'offer' })
                .andWhere('app.clientDecisionType = :dt', { dt: 'request-offer' })
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
            this.applicationRepo
                .createQueryBuilder('app')
                .select('app.clientDecisionType', 'decision')
                .addSelect('COUNT(*)', 'count')
                .leftJoin('app.jobOrder', 'jo')
                .where('jo.companyId IN (:...cids)', { cids: companyIds })
                .andWhere('app.clientDecisionType IS NOT NULL')
                .groupBy('app.clientDecisionType')
                .getRawMany(),
            this.jobOrderRepo
                .createQueryBuilder('jo')
                .leftJoin('jo.applications', 'app')
                .select('jo.id', 'id')
                .addSelect('jo.title', 'title')
                .addSelect('jo.status', 'status')
                .addSelect('jo.workArrangement', 'workArrangement')
                .addSelect('jo.locationCity', 'locationCity')
                .addSelect('jo.locationCountry', 'locationCountry')
                .addSelect('COUNT(app.id)', 'candidateCount')
                .where('jo.companyId IN (:...cids)', { cids: companyIds })
                .groupBy('jo.id')
                .orderBy('jo.createdAt', 'DESC')
                .limit(5)
                .getRawMany(),
        ]);

        const decisionTypes: ClientDecisionType[] = ['request-offer', 'pass', 'hold'];
        const myDecisions = decisionTypes.map((dt) => {
            const row = decisionRows.find((r) => r.decision === dt);
            return { decision: dt, count: row ? Number(row.count) : 0 };
        });

        const myJobOrders = myJobOrderRows.map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
            workArrangement: row.workArrangement,
            locationCity: row.locationCity,
            locationCountry: row.locationCountry,
            candidateCount: Number(row.candidateCount),
        }));

        this.logger.log(`getClientDashboard companyIds=[${companyIds}] → activeOrders=${activeOrders} pendingDecisions=${pendingDecisions}`);
        return {
            activeOrders,
            totalCandidates,
            pendingDecisions,
            offersInProgress,
            recentCandidates,
            myDecisions,
            myJobOrders,
        };
    }


}
