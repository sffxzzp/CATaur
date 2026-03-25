import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { JobOrder, JobOrderEmploymentType, JobOrderWorkArrangement } from '../database/entities/job-order.entity';
import { User } from '../database/entities/user.entity';
import { CreateJobOrderDto } from './dto/create-job-order.dto';
import { UpdateJobOrderDto } from './dto/update-job-order.dto';
import { UlidService } from '../common/ulid.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class JobOrdersService {
    private readonly logger = new Logger(JobOrdersService.name);

    constructor(
        @InjectRepository(JobOrder)
        private repo: Repository<JobOrder>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private ulidService: UlidService,
        private encryptionService: EncryptionService,
    ) { }

    async findAll(
        where: FindOptionsWhere<JobOrder> & { companyIds?: string[] },
        opts: {
            page?: number;
            limit?: number;
            status?: string;
            statuses?: string[];
            search?: string;
            employmentTypes?: JobOrderEmploymentType[];
            workArrangements?: JobOrderWorkArrangement[];
            locationCountry?: string;
            locationState?: string;
            locationCity?: string;
            sortBy?: 'recent' | 'openings';
        } = {},
    ) {
        const {
            page = 1,
            limit = 20,
            status,
            statuses,
            search,
            employmentTypes,
            workArrangements,
            locationCountry,
            locationState,
            locationCity,
            sortBy = 'recent',
        } = opts;

        const qb = this.repo.createQueryBuilder('jo')
            .leftJoinAndSelect('jo.company', 'company')
            .loadRelationCountAndMap('jo.applicants', 'jo.applications');

        // Apply caller-supplied scope (e.g. companyId)
        if (where.companyId) {
            qb.andWhere('jo.companyId = :companyId', { companyId: where.companyId });
        }
        if (where.companyIds?.length) {
            qb.andWhere('jo.companyId IN (:...companyIds)', { companyIds: where.companyIds });
        }
        else {
            qb.andWhere('1=0')
        }
        if (status) {
            qb.andWhere('jo.status = :status', { status });
        } else if (statuses?.length) {
            qb.andWhere('jo.status IN (:...statuses)', { statuses });
        }
        if (employmentTypes?.length) {
            qb.andWhere('jo.employmentType IN (:...employmentTypes)', { employmentTypes });
        }
        if (workArrangements?.length) {
            qb.andWhere('jo.workArrangement IN (:...workArrangements)', { workArrangements });
        }
        if (locationCountry) {
            qb.andWhere('jo.locationCountry = :locationCountry', { locationCountry });
        }
        if (locationState) {
            qb.andWhere('jo.locationState = :locationState', { locationState });
        }
        if (locationCity) {
            qb.andWhere('jo.locationCity = :locationCity', { locationCity });
        }
        const searchTrimmed = search?.trim();
        if (searchTrimmed) {
            qb.andWhere('(jo.title LIKE :search OR jo.id LIKE :search)', { search: `%${searchTrimmed}%` });
        }

        const orderByColumn = sortBy === 'openings' ? 'jo.openings' : 'jo.createdAt';

        const [data, total] = await qb
            .orderBy(orderByColumn, 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: data.map((jobOrder) => this.decryptJobOrder(jobOrder)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string, where: FindOptionsWhere<JobOrder> = {}): Promise<JobOrder> {
        const jo = await this.repo.findOne({
            where: { id, ...where },
            relations: ['company'],
        });
        if (!jo) throw new NotFoundException('Job order not found');
        return this.decryptJobOrder(jo);
    }

    async create(dto: CreateJobOrderDto, recruiterId: string): Promise<JobOrder> {
        // Get recruiter info to set owner
        const recruiter = await this.userRepo.findOne({ where: { id: recruiterId } });
        const ownerName = recruiter ? (recruiter.nickname || recruiter.email) : null;

        const jo = this.repo.create({
            id: this.ulidService.generate(),
            title: dto.title,
            description: dto.description ?? null,
            companyId: dto.companyId ?? null,
            priority: (dto.priority as any) ?? 'medium',
            location: dto.location
                ? (this.encryptionService.encryptText(dto.location) as unknown as string)
                : dto.location ?? null,
            openings: dto.openings ?? 1,
            salary: dto.salary
                ? (this.encryptionService.encryptText(dto.salary) as unknown as string)
                : dto.salary ?? null,
            tags: dto.tags ?? null,
            employmentType: dto.employmentType ?? null,
            workArrangement: dto.workArrangement ?? null,
            locationCountry: dto.locationCountry ?? null,
            locationState: dto.locationState ?? null,
            locationCity: dto.locationCity ?? null,
            owner: ownerName,
            status: 'active',
        });
        await this.repo.save(jo);
        this.logger.log(`Job order created: ${jo.id} ("${jo.title}") assigned to recruiter ${recruiterId}, owner: ${ownerName}`);
        return this.findOne(jo.id);
    }

    async update(
        id: string,
        dto: UpdateJobOrderDto,
        scope: FindOptionsWhere<JobOrder> = {},
    ): Promise<JobOrder> {
        const jo = await this.findOne(id, scope);
        Object.assign(jo, {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.companyId !== undefined && { companyId: dto.companyId }),
            ...(dto.priority !== undefined && { priority: dto.priority }),
            ...(dto.location !== undefined && {
                location: dto.location
                    ? (this.encryptionService.encryptText(dto.location) as unknown as string)
                    : dto.location,
            }),
            ...(dto.openings !== undefined && { openings: dto.openings }),
            ...(dto.salary !== undefined && {
                salary: dto.salary
                    ? (this.encryptionService.encryptText(dto.salary) as unknown as string)
                    : dto.salary,
            }),
            ...(dto.tags !== undefined && { tags: dto.tags }),
            ...(dto.employmentType !== undefined && { employmentType: dto.employmentType }),
            ...(dto.workArrangement !== undefined && { workArrangement: dto.workArrangement }),
            ...(dto.locationCountry !== undefined && { locationCountry: dto.locationCountry }),
            ...(dto.locationState !== undefined && { locationState: dto.locationState }),
            ...(dto.locationCity !== undefined && { locationCity: dto.locationCity }),
        });
        await this.repo.save(jo);
        return this.findOne(id);
    }

    async updateStatus(
        id: string,
        status: string,
        scope: FindOptionsWhere<JobOrder> = {},
    ): Promise<JobOrder> {
        const jo = await this.findOne(id, scope);
        jo.status = status as any;
        await this.repo.save(jo);
        this.logger.log(`Job order ${id} status updated to "${status}"`);
        return jo;
    }

    async delete(id: string): Promise<void> {
        const jo = await this.repo.findOne({ where: { id } });
        if (!jo) throw new NotFoundException('Job order not found');
        await this.repo.remove(jo);
        this.logger.log(`Job order deleted: ${id}`);
    }

    private decryptJobOrder(jobOrder: JobOrder): JobOrder {
        jobOrder.location = jobOrder.location
            ? (this.encryptionService.decryptText(jobOrder.location as unknown as Buffer) as any)
            : jobOrder.location;
        jobOrder.salary = jobOrder.salary
            ? (this.encryptionService.decryptText(jobOrder.salary as unknown as Buffer) as any)
            : jobOrder.salary;
        return jobOrder;
    }
}

