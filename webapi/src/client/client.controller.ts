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
import { ClientJobOrder, ClientJobOrderDetail } from './dto/client-job-order.dto';
import { ClientApplication } from './dto/client-candidate.dto';
import { ClientDecisionsResponseDto } from './dto/client-decisions.dto';

const PaginatedJobOrdersResponseDto = createPaginatedResponseDto(ClientJobOrder);
const PaginatedApplicationsResponseDto = createPaginatedResponseDto(ClientApplication);
const JobOrderResponseDto = createApiResponseDto(JobOrder);
const JobOrderDetailResponseDto = createApiResponseDto(ClientJobOrderDetail);
const ApplicationResponseDto = createApiResponseDto(Application);

@ApiTags('client')
@ApiExtraModels(
    PaginatedJobOrdersResponseDto,
    PaginatedApplicationsResponseDto,
    ClientJobOrder,
    ClientJobOrderDetail,
    ClientApplication,
    ClientDecisionsResponseDto,
    JobOrder,
    Application,
    JobOrderResponseDto,
    JobOrderDetailResponseDto,
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
    ) { }

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
    @ApiQuery({ name: 'search', required: false })
    @ApiOkResponse({ type: PaginatedJobOrdersResponseDto })
    async listOrders(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
    ): Promise<PaginatedResponse<ClientJobOrder>> {
        const companyIds = await this.getCompanyIds(user);
        const role = user.roles?.[0]?.role;
        const result = await this.jobOrdersService.findAll(
            { companyIds, role },
            {
                page: +page,
                limit: +limit,
                status: status || undefined,
            },
        );

        return {
            ...result,
            data: result.data.map((jo: any) => ({
                id: jo.id,
                title: jo.title,
                locationCountry: jo.locationCountry,
                locationState: jo.locationState,
                locationCity: jo.locationCity,
                employmentType: jo.employmentType,
                status: jo.status,
                candidateCount: jo.applicants || 0,
                createdAt: jo.createdAt,
            })),
        };
    }

    @Get('orders/:id')
    @ApiOperation({ summary: "Get a job order's details" })
    @ApiOkResponse({ type: ClientJobOrderDetail })
    async getOrder(@GetUser() user: User, @Param('id') id: string): Promise<ClientJobOrderDetail> {
        const companyIds = await this.getCompanyIds(user);
        const jo = await this.jobOrdersService.findOne(id);
        if (!companyIds.includes(jo.companyId ?? '')) {
            throw new NotFoundException('Not found');
        }
        const submitted = await this.applicationsService.countByJobOrderId(id);
        return {
            ...jo,
            submitted,
        } as ClientJobOrderDetail;
    }

    // ── Applications ────────────────────────────────────────────────────────
    @Get('applications')
    @ApiOperation({ summary: "List applications for this client's orders" })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'jobOrderId', required: false })
    @ApiQuery({ name: 'candidateNameOrJobTitle', required: false })
    @ApiOkResponse({ type: PaginatedApplicationsResponseDto })
    async listApplications(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('jobOrderId') jobOrderId?: string,
        @Query('candidateNameOrJobTitle') candidateNameOrJobTitle?: string,
    ): Promise<PaginatedResponse<ClientApplication>> {
        const companyIds = await this.getCompanyIds(user);
        const role = user.roles?.[0]?.role;
        const result = await this.applicationsService.findAll(
            { companyIds, role },
            {
                page: +page,
                limit: +limit,
                status: status || undefined,
                jobOrderId: jobOrderId || undefined,
                candidateNameOrJobTitle: candidateNameOrJobTitle || undefined,
            },
        );

        return {
            ...result,
            data: result.data.map((app: any) => ({
                id: app.id,
                candidate: {
                    user: app.candidate,
                },
                jobTitle: app.jobOrder?.title,
                status: app.status,
                createdAt: app.createdAt,
                locationCountry: app.locationCountry,
                locationState: app.locationState,
                locationCity: app.locationCity,
            })),
        };
    }

    @Get('decisions')
    @ApiOperation({ summary: "List candidates for decision making with stats" })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'jobId', required: false })
    @ApiQuery({ name: 'candidateNameOrJobOrderTitle', required: false })
    @ApiOkResponse({ type: ClientDecisionsResponseDto })
    async decisions(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('jobId') jobId?: string,
        @Query('candidateNameOrJobOrderTitle') candidateNameOrJobOrderTitle?: string,
    ): Promise<ClientDecisionsResponseDto> {
        const companyIds = await this.getCompanyIds(user);
        const role = user.roles?.[0]?.role;
        return this.applicationsService.findDecisions(
            { companyIds, role },
            {
                page: +page,
                limit: +limit,
                jobOrderId: jobId || undefined,
                candidateNameOrJobTitle: candidateNameOrJobOrderTitle || undefined,
            },
        );
    }

    @Get('applications/:id')
    @ApiOperation({ summary: "Get application detail" })
    @ApiOkResponse({ type: ApplicationResponseDto })
    async getApplication(@GetUser() user: User, @Param('id') id: string): Promise<Application> {
        const companyIds = await this.getCompanyIds(user);
        return this.applicationsService.findOne(id, { companyIds });
    }

    @Patch('applications/:id/decision')
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
        const role = user.roles?.[0]?.role;
        return this.reportsService.getJobOrderStats({ companyIds, role });
    }

    @Get('reports/applications')
    @ApiOperation({ summary: 'Application stats for my company' })
    @ApiOkResponse({ schema: { type: 'object', properties: { total: { type: 'number' }, byStatus: { type: 'object' }, bySource: { type: 'object' } } } })
    async reportApplications(@GetUser() user: User): Promise<{ total: number; byStatus: Record<string, number>; bySource: Record<string, number> }> {
        const companyIds = await this.getCompanyIds(user);
        const role = user.roles?.[0]?.role;
        return this.reportsService.getApplicationStats({ companyIds, role });
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
