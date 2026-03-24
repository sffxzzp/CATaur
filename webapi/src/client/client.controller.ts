import {
    Controller, Get, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiExtraModels, ApiOkResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { Role } from '../database/entities/user-role.entity';
import { User } from '../database/entities/user.entity';
import { Company } from '../database/entities/company.entity';
import { JobOrdersService } from '../job-orders/job-orders.service';
import { ApplicationsService } from '../applications/applications.service';
import { SubmitDecisionDto } from '../applications/dto/application.dto';
import { ReportsService } from '../reports/reports.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { AuditLog } from '../common/decorators/audit-log.decorator';
import { createPaginatedResponseDto, PaginatedResponse } from '../common/dto/paginated-response.dto';
import { createApiResponseDto } from '../common/dto/api-response.dto';
import { JobOrder } from '../database/entities/job-order.entity';
import { Application } from '../database/entities/application.entity';
import { ClientDashboardResponseDto } from '../dashboard/dto/client-dashboard-response.dto';

const PaginatedJobOrdersResponseDto = createPaginatedResponseDto(JobOrder);
const PaginatedApplicationsResponseDto = createPaginatedResponseDto(Application);
const JobOrderResponseDto = createApiResponseDto(JobOrder);
const ApplicationResponseDto = createApiResponseDto(Application);

@ApiTags('client')
@ApiExtraModels(
    PaginatedJobOrdersResponseDto,
    PaginatedApplicationsResponseDto,
    JobOrder,
    Application,
    JobOrderResponseDto,
    ApplicationResponseDto,
)
@Controller('client')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(Role.CLIENT)
@ApiBearerAuth()
export class ClientController {
    constructor(
        private jobOrdersService: JobOrdersService,
        private applicationsService: ApplicationsService,
        @InjectRepository(Company)
        private companiesRepository: Repository<Company>,
        private reportsService: ReportsService,
        private dashboardService: DashboardService,
    ) {}

    /** Resolve all company IDs this client user belongs to */
    private async getCompanyIds(user: User): Promise<string[]> {
        const companies = await this.companiesRepository.find({
            where: { clientId: user.id },
            select: ['id'],
        });
        return companies.map((company) => company.id);
    }

    // ── Orders ────────────────────────────────────────────────────────────
    @Get('orders')
    @ApiOperation({ summary: "List this client's job orders" })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'statuses', required: false, isArray: true })
    @ApiQuery({ name: 'search', required: false })
    @ApiOkResponse({ type: PaginatedJobOrdersResponseDto })
    async listOrders(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('statuses') statusesRaw?: string | string[],
        @Query('search') search?: string,
    ): Promise<PaginatedResponse<JobOrder>> {
        const companyIds = await this.getCompanyIds(user);
        if (!companyIds.length) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };

        let statuses: string[] | undefined;
        if (Array.isArray(statusesRaw)) {
            statuses = statusesRaw;
        } else if (typeof statusesRaw === 'string') {
            statuses = statusesRaw.split(',');
        }
        if (statuses) {
            statuses = statuses.map((s) => s.trim()).filter(Boolean);
            if (!statuses.length) statuses = undefined;
        }

        return this.jobOrdersService.findAll({ companyIds }, {
            page: +page,
            limit: +limit,
            status,
            statuses,
            search,
        });
    }

    @Get('orders/:id')
    @ApiOperation({ summary: "Get a job order's details" })
    @ApiOkResponse({ type: JobOrderResponseDto })
    async getOrder(@GetUser() user: User, @Param('id') id: string): Promise<JobOrder> {
        const companyIds = await this.getCompanyIds(user);
        const jo = await this.jobOrdersService.findOne(id);
        if (!companyIds.includes(jo.companyId ?? '')) {
            throw new NotFoundException('Not found');
        }
        return jo;
    }

    // ── Candidates ────────────────────────────────────────────────────────
    @Get('candidates')
    @ApiOperation({ summary: "List candidates for this client's orders" })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'jobOrderId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiOkResponse({ type: PaginatedApplicationsResponseDto })
    async listCandidates(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('jobOrderId') jobOrderId?: string,
        @Query('search') search?: string,
    ): Promise<PaginatedResponse<Application>> {
        const companyIds = await this.getCompanyIds(user);
        return this.applicationsService.findAll({ companyIds }, {
            page: +page, limit: +limit, status, jobOrderId, search,
        });
    }

    @Get('candidates/:id')
    @ApiOperation({ summary: "Get candidate application detail" })
    @ApiOkResponse({ type: ApplicationResponseDto })
    async getCandidate(@GetUser() user: User, @Param('id') id: string): Promise<Application> {
        const companyIds = await this.getCompanyIds(user);
        return this.applicationsService.findOne(id, { companyIds });
    }

    @Patch('candidates/:id/decision')
    @AuditLog('submit candidate decision')
    @ApiOperation({ summary: 'Submit a hiring decision (request-offer / pass / hold)' })
    @ApiOkResponse({ type: ApplicationResponseDto })
    async submitDecision(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: SubmitDecisionDto,
    ): Promise<Application> {
        const companyIds = await this.getCompanyIds(user);
        return this.applicationsService.submitDecision(id, dto, companyIds);
    }

    // ── Reports ───────────────────────────────────────────────────────────
    @Get('reports/job-orders')
    @ApiOperation({ summary: 'Job order stats for my company' })
    @ApiOkResponse({ schema: { type: 'object', properties: { total: { type: 'number' }, byStatus: { type: 'object' } } } })
    async reportJobOrders(@GetUser() user: User): Promise<{ total: number; byStatus: Record<string, number> }> {
        const companyIds = await this.getCompanyIds(user);
        return this.reportsService.getJobOrderStats({ companyIds });
    }

    @Get('reports/applications')
    @ApiOperation({ summary: 'Application stats for my company' })
    @ApiOkResponse({ schema: { type: 'object', properties: { total: { type: 'number' }, byStatus: { type: 'object' }, bySource: { type: 'object' } } } })
    async reportApplications(@GetUser() user: User): Promise<{ total: number; byStatus: Record<string, number>; bySource: Record<string, number> }> {
        const companyIds = await this.getCompanyIds(user);
        return this.reportsService.getApplicationStats({ companyIds });
    }

    // ── Dashboard ─────────────────────────────────────────────────────────
    @Get('dashboard')
    @ApiOperation({ summary: 'Client dashboard KPIs' })
    @ApiOkResponse({ type: ClientDashboardResponseDto })
    async dashboard(@GetUser() user: User): Promise<ClientDashboardResponseDto> {
        const companyIds = await this.getCompanyIds(user);
        return this.dashboardService.getClientDashboard(companyIds);
    }
}
