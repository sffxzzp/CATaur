import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobOrder } from '../database/entities/job-order.entity';
import { Application } from '../database/entities/application.entity';

export interface JobOrderStats {
    total: number;
    byStatus: Record<string, number>;
}

export interface ApplicationStats {
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
}

export interface TopJobOrder {
    id: string;
    title: string;
    status: string;
    applicationCount: number;
}

export interface ActivityPoint {
    date: string;
    jobOrders: number;
    applications: number;
}

export interface ReportScope {
    companyIds?: string[];
}

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        @InjectRepository(JobOrder)
        private jobOrderRepo: Repository<JobOrder>,
        @InjectRepository(Application)
        private applicationRepo: Repository<Application>,
    ) {}

    /** Job order counts grouped by status, scoped by role */
    async getJobOrderStats(scope: ReportScope = {}): Promise<JobOrderStats> {
        const qb = this.jobOrderRepo.createQueryBuilder('jo')
            .select('jo.status', 'status')
            .addSelect('COUNT(*)', 'count');

        if (scope.companyIds?.length) {
            qb.where('jo.companyId IN (:...cids)', { cids: scope.companyIds });
        }

        const rows: { status: string; count: string }[] = await qb
            .groupBy('jo.status')
            .getRawMany();

        const byStatus: Record<string, number> = {};
        let total = 0;
        for (const row of rows) {
            byStatus[row.status] = Number(row.count);
            total += Number(row.count);
        }

        this.logger.log(`getJobOrderStats scope=${JSON.stringify(scope)} → total=${total}`);
        return { total, byStatus };
    }

    /** Application counts grouped by status and source, scoped by role */
    async getApplicationStats(scope: ReportScope = {}): Promise<ApplicationStats> {
        const qb = this.applicationRepo.createQueryBuilder('app')
            .leftJoin('app.jobOrder', 'jobOrder');

        if (scope.companyIds?.length) {
            qb.where('jobOrder.companyId IN (:...cids)', { cids: scope.companyIds });
        }

        const all = await qb.getMany();

        const byStatus: Record<string, number> = {};
        const bySource: Record<string, number> = {};

        for (const app of all) {
            byStatus[app.status] = (byStatus[app.status] ?? 0) + 1;
            bySource[app.source] = (bySource[app.source] ?? 0) + 1;
        }

        this.logger.log(`getApplicationStats scope=${JSON.stringify(scope)} → total=${all.length}`);
        return { total: all.length, byStatus, bySource };
    }

    /** Job orders ranked by their number of applications */
    async getTopJobOrders(scope: ReportScope = {}, limit = 5): Promise<TopJobOrder[]> {
        const qb = this.applicationRepo.createQueryBuilder('app')
            .leftJoin('app.jobOrder', 'jobOrder')
            .select('jobOrder.id', 'id')
            .addSelect('jobOrder.title', 'title')
            .addSelect('jobOrder.status', 'status')
            .addSelect('COUNT(app.id)', 'applicationCount')
            .groupBy('jobOrder.id')
            .addGroupBy('jobOrder.title')
            .addGroupBy('jobOrder.status')
            .orderBy('applicationCount', 'DESC')
            .limit(limit);

        if (scope.companyIds?.length) {
            qb.where('jobOrder.companyId IN (:...cids)', { cids: scope.companyIds });
        }

        const rows = await qb.getRawMany();
        this.logger.log(`getTopJobOrders scope=${JSON.stringify(scope)} limit=${limit} → ${rows.length} results`);
        return rows.map(r => ({
            id: r.id,
            title: r.title,
            status: r.status,
            applicationCount: Number(r.applicationCount),
        }));
    }

    /** Daily counts of new job orders and applications over the last N days */
    async getActivityTimeline(scope: ReportScope = {}, days = 30): Promise<ActivityPoint[]> {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().slice(0, 10);

        // Job orders
        const joQb = this.jobOrderRepo.createQueryBuilder('jo')
            .select("DATE_FORMAT(jo.createdAt, '%Y-%m-%d')", 'date')
            .addSelect('COUNT(*)', 'count')
            .where('jo.createdAt >= :since', { since: sinceStr })
            .groupBy('date')
            .orderBy('date', 'ASC');

        if (scope.companyIds?.length) {
            joQb.andWhere('jo.companyId IN (:...cids)', { cids: scope.companyIds });
        }

        // Applications
        const appQb = this.applicationRepo.createQueryBuilder('app')
            .leftJoin('app.jobOrder', 'jobOrder')
            .select("DATE_FORMAT(app.createdAt, '%Y-%m-%d')", 'date')
            .addSelect('COUNT(*)', 'count')
            .where('app.createdAt >= :since', { since: sinceStr })
            .groupBy('date')
            .orderBy('date', 'ASC');

        if (scope.companyIds?.length) {
            appQb.andWhere('jobOrder.companyId IN (:...cids)', { cids: scope.companyIds });
        }

        const [joRows, appRows]: [{ date: string; count: string }[], { date: string; count: string }[]] =
            await Promise.all([joQb.getRawMany(), appQb.getRawMany()]);

        // Merge into a daily map
        const map: Record<string, ActivityPoint> = {};
        for (const r of joRows) {
            map[r.date] = { date: r.date, jobOrders: Number(r.count), applications: 0 };
        }
        for (const r of appRows) {
            if (map[r.date]) {
                map[r.date].applications = Number(r.count);
            } else {
                map[r.date] = { date: r.date, jobOrders: 0, applications: Number(r.count) };
            }
        }

        const result = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
        this.logger.log(`getActivityTimeline scope=${JSON.stringify(scope)} days=${days} → ${result.length} data points`);
        return result;
    }
}
