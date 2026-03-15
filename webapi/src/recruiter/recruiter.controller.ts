import {
    Controller, Get, Post, Put, Patch, Delete,
    Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiExtraModels, ApiOkResponse, ApiNoContentResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { Role } from '../database/entities/user-role.entity';
import { User } from '../database/entities/user.entity';
import { JobOrdersService } from '../job-orders/job-orders.service';
import { ApplicationsService } from '../applications/applications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminService } from '../admin/admin.service';
import { CreateJobOrderDto } from '../job-orders/dto/create-job-order.dto';
import { UpdateJobOrderDto, UpdateJobOrderStatusDto } from '../job-orders/dto/update-job-order.dto';
import {
    CreateApplicationDto,
    UpdateApplicationStatusDto,
    BulkImportDto,
} from '../applications/dto/application.dto';
import { ReportsService } from '../reports/reports.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { AuditLog } from '../common/decorators/audit-log.decorator';
import { CreateCompanyDto } from '../admin/dto/create-company.dto';
import { UpdateCompanyDto } from '../admin/dto/update-company.dto';
import { UpdateRecruiterCandidateDto } from './dto/update-recruiter-candidate.dto';
import { createPaginatedResponseDto, PaginatedResponse } from '../common/dto/paginated-response.dto';
import { createApiResponseDto } from '../common/dto/api-response.dto';
import { JobOrder } from '../database/entities/job-order.entity';
import { Application } from '../database/entities/application.entity';
import { Notification } from '../database/entities/notification.entity';
import { Company } from '../database/entities/company.entity';


const PaginatedJobOrdersResponseDto = createPaginatedResponseDto(JobOrder);
const PaginatedApplicationsResponseDto = createPaginatedResponseDto(Application);
const PaginatedCompaniesResponseDto = createPaginatedResponseDto(Company);
const JobOrderResponseDto = createApiResponseDto(JobOrder);
const ApplicationResponseDto = createApiResponseDto(Application);
const CompanyResponseDto = createApiResponseDto(Company);

@ApiTags('recruiter')
@ApiExtraModels(
    PaginatedJobOrdersResponseDto,
    PaginatedApplicationsResponseDto,
    PaginatedCompaniesResponseDto,
    JobOrder,
    Application,
    Notification,
    Company,
    JobOrderResponseDto,
    ApplicationResponseDto,
    CompanyResponseDto,
)
@Controller('recruiter')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(Role.RECRUITER, Role.ADMIN)
@ApiBearerAuth()
export class RecruiterController {
    constructor(
        private jobOrdersService: JobOrdersService,
        private applicationsService: ApplicationsService,
        private notificationsService: NotificationsService,
        private adminService: AdminService,
        private reportsService: ReportsService,
        private dashboardService: DashboardService,
    ) {}

    // ── Job Orders ────────────────────────────────────────────────────────
    @Get('job-orders')
    @ApiOperation({ summary: 'List my job orders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'companyId', required: false })
    @ApiQuery({ name: 'employmentType', required: false })
    @ApiQuery({ name: 'workArrangement', required: false })
    @ApiQuery({ name: 'locationCountry', required: false })
    @ApiQuery({ name: 'locationState', required: false })
    @ApiQuery({ name: 'locationCity', required: false })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['recent', 'openings'] })
    @ApiOkResponse({ type: PaginatedJobOrdersResponseDto })
    listJobOrders(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('companyId') companyId?: string,
        @Query('employmentType') employmentType?: string,
        @Query('workArrangement') workArrangement?: string,
        @Query('locationCountry') locationCountry?: string,
        @Query('locationState') locationState?: string,
        @Query('locationCity') locationCity?: string,
        @Query('sortBy') sortBy?: 'recent' | 'openings',
    ): Promise<PaginatedResponse<JobOrder>> {
        const where: any = { assignedToId: user.id };
        if (companyId) {
            where.companyId = companyId;
        }
        return this.jobOrdersService.findAll(
            where,
            {
                page: +page,
                limit: +limit,
                status,
                search,
                employmentTypes: employmentType ? [employmentType as any] : undefined,
                workArrangements: workArrangement ? [workArrangement as any] : undefined,
                locationCountry,
                locationState,
                locationCity,
                sortBy: sortBy || 'recent',
            },
        );
    }

    @Post('job-orders')
    @AuditLog('create job order')
    @ApiOperation({ summary: 'Create a job order (assigned to me)' })
    @ApiCreatedResponse({ type: JobOrderResponseDto })
    createJobOrder(@GetUser() user: User, @Body() dto: CreateJobOrderDto): Promise<JobOrder> {
        return this.jobOrdersService.create(dto, user.id);
    }

    @Get('job-orders/:id')
    @ApiOperation({ summary: 'Get a job order by ID (must be mine)' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    getJobOrder(@GetUser() user: User, @Param('id') id: string): Promise<JobOrder> {
        return this.jobOrdersService.findOne(id, { assignedToId: user.id });
    }

    @Put('job-orders/:id')
    @AuditLog('update job order')
    @ApiOperation({ summary: 'Update a job order (must be mine)' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    updateJobOrder(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateJobOrderDto,
    ): Promise<JobOrder> {
        return this.jobOrdersService.update(id, dto, { assignedToId: user.id });
    }

    @Patch('job-orders/:id/status')
    @AuditLog('update job order status')
    @ApiOperation({ summary: 'Update job order status (must be mine)' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    updateJobOrderStatus(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateJobOrderStatusDto,
    ): Promise<JobOrder> {
        return this.jobOrdersService.updateStatus(id, dto.status, { assignedToId: user.id });
    }

    @Delete('job-orders/:id')
    @AuditLog('delete job order')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a job order (must be mine)' })
    @ApiNoContentResponse({ description: 'Job order deleted successfully' })
    async deleteJobOrder(@GetUser() user: User, @Param('id') id: string): Promise<void> {
        // First verify the job order belongs to this recruiter
        await this.jobOrdersService.findOne(id, { assignedToId: user.id });
        // Then delete it
        await this.jobOrdersService.delete(id);
    }

    // ── Applications ──────────────────────────────────────────────────────
    @Get('applications')
    @ApiOperation({ summary: 'List applications for my job orders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'jobOrderId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiOkResponse({ type: PaginatedApplicationsResponseDto })
    listApplications(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('jobOrderId') jobOrderId?: string,
        @Query('search') search?: string,
    ): Promise<PaginatedResponse<Application>> {
        return this.applicationsService.findAll(
            { assignedToId: user.id },
            { page: +page, limit: +limit, status, jobOrderId, search },
        );
    }

    @Get('applications/:id')
    @ApiOperation({ summary: 'Get an application by ID (must belong to my job order)' })
    @ApiOkResponse({ type: ApplicationResponseDto })
    getApplication(@GetUser() user: User, @Param('id') id: string): Promise<Application> {
        return this.applicationsService.findOne(id, { assignedToId: user.id });
    }

    @Post('applications')
    @AuditLog('create application')
    @ApiOperation({ summary: 'Manually add a candidate to a job order' })
    @ApiOkResponse({ type: ApplicationResponseDto })
    createApplication(@Body() dto: CreateApplicationDto): Promise<Application> {
        return this.applicationsService.create(dto, 'recruiter_import');
    }

    @Patch('applications/:id/status')
    @AuditLog('update application status')
    @ApiOperation({ summary: 'Update application status (triggers email on interview/offer)' })
    @ApiOkResponse({ type: ApplicationResponseDto })
    updateApplicationStatus(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateApplicationStatusDto,
    ): Promise<Application> {
        return this.applicationsService.updateStatus(id, dto, { assignedToId: user.id });
    }

    // ── Candidates ────────────────────────────────────────────────────────
    @Get('candidates')
    @ApiOperation({ summary: 'List candidates for my assigned job orders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'jobOrderId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'location', required: false })
    @ApiOkResponse({ type: PaginatedApplicationsResponseDto })
    listCandidates(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('jobOrderId') jobOrderId?: string,
        @Query('search') search?: string,
        @Query('location') location?: string,
    ): Promise<PaginatedResponse<Application>> {
        return this.applicationsService.findRecruiterCandidates(user.id, {
            page: +page,
            limit: +limit,
            status,
            jobOrderId,
            search,
            location,
        });
    }

    @Get('candidates/:id')
    @ApiOperation({ summary: 'Get candidate application detail (must belong to my job order)' })
    @ApiOkResponse({ type: ApplicationResponseDto })
    getCandidate(@GetUser() user: User, @Param('id') id: string): Promise<Application> {
        return this.applicationsService.findRecruiterCandidateById(user.id, id);
    }

    @Put('candidates/:id')
    @AuditLog('update candidate')
    @ApiOperation({ summary: 'Update candidate profile fields and application fields' })
    @ApiOkResponse({ type: ApplicationResponseDto })
    updateCandidate(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateRecruiterCandidateDto,
    ): Promise<Application> {
        return this.applicationsService.updateRecruiterCandidate(user.id, id, dto);
    }

    @Post('candidates/import')
    @AuditLog('bulk import candidates')
    @ApiOperation({ summary: 'Bulk-import candidates into a job order' })
    @ApiOkResponse({ type: ApplicationResponseDto, isArray: true })
    bulkImport(@Body() dto: BulkImportDto): Promise<Application[]> {
        return this.applicationsService.bulkImport(dto);
    }

    // ── Companies ──────────────────────────────────────────────────────────
    @Get('companies')
    @ApiOperation({ summary: 'List companies' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiOkResponse({ type: PaginatedCompaniesResponseDto })
    listCompanies(
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('search') search?: string,
    ): Promise<PaginatedResponse<Company>> {
        return this.adminService.listCompanies(+page, +limit, search);
    }

    @Get('companies/:id')
    @ApiOperation({ summary: 'Get company details by ID' })
    @ApiOkResponse({ type: CompanyResponseDto })
    getCompanyById(@Param('id') id: string): Promise<Company> {
        return this.adminService.getCompanyById(id);
    }

    @Post('companies')
    @AuditLog('create company')
    @ApiOperation({ summary: 'Create a company' })
    @ApiOkResponse({ type: CompanyResponseDto })
    createCompany(@GetUser() user: User, @Body() dto: CreateCompanyDto): Promise<Company | null> {
        return this.adminService.createCompany(dto, user.nickname || user.email);
    }

    @Put('companies/:id')
    @AuditLog('update company')
    @ApiOperation({ summary: 'Update a company' })
    @ApiOkResponse({ type: CompanyResponseDto })
    updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto): Promise<Company | null> {
        return this.adminService.updateCompany(id, dto);
    }

    @Delete('companies/:id')
    @AuditLog('delete company')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a company' })
    @ApiNoContentResponse()
    async deleteCompany(@Param('id') id: string): Promise<{ success: boolean }> {
        return this.adminService.deleteCompany(id);
    }

    // ── Notifications ─────────────────────────────────────────────────────
    @Get('notifications')
    @ApiOperation({ summary: 'Get my notifications' })
    @ApiOkResponse({ type: [Notification] })
    getNotifications(@GetUser() user: User): Promise<Notification[]> {
        return this.notificationsService.findAll(user.id);
    }

    @Patch('notifications/read-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiNoContentResponse()
    markAllRead(@GetUser() user: User): Promise<void> {
        return this.notificationsService.markAllRead(user.id);
    }

    // ── Reports ───────────────────────────────────────────────────
    @Get('reports/job-orders')
    @ApiOperation({ summary: 'Job order stats for my assigned orders' })
    @ApiOkResponse({ schema: { type: 'object', properties: { total: { type: 'number' }, byStatus: { type: 'object' } } } })
    reportJobOrders(@GetUser() user: User): Promise<{ total: number; byStatus: Record<string, number> }> {
        return this.reportsService.getJobOrderStats({ assignedToId: user.id });
    }

    @Get('reports/applications')
    @ApiOperation({ summary: 'Application stats for my job orders' })
    @ApiOkResponse({ schema: { type: 'object', properties: { total: { type: 'number' }, byStatus: { type: 'object' }, bySource: { type: 'object' } } } })
    reportApplications(@GetUser() user: User): Promise<{ total: number; byStatus: Record<string, number>; bySource: Record<string, number> }> {
        return this.reportsService.getApplicationStats({ assignedToId: user.id });
    }

    @Get('reports/top-job-orders')
    @ApiOperation({ summary: 'My top job orders by application volume' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiOkResponse({
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    status: { type: 'string' },
                    applicationCount: { type: 'number' },
                },
            },
        },
    })
    reportTopJobOrders(@GetUser() user: User, @Query('limit') limit = '5'): Promise<Array<{ id: string; title: string; status: string; applicationCount: number }>> {
        return this.reportsService.getTopJobOrders({ assignedToId: user.id }, +limit);
    }

    @Get('reports/activity')
    @ApiOperation({ summary: 'My daily activity timeline' })
    @ApiQuery({ name: 'days', required: false })
    @ApiOkResponse({
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    date: { type: 'string' },
                    jobOrders: { type: 'number' },
                    applications: { type: 'number' },
                },
            },
        },
    })
    reportActivity(@GetUser() user: User, @Query('days') days = '30'): Promise<Array<{ date: string; jobOrders: number; applications: number }>> {
        return this.reportsService.getActivityTimeline({ assignedToId: user.id }, +days);
    }

    // ── Dashboard ─────────────────────────────────────────────────
    @Get('dashboard')
    @ApiOperation({ summary: 'Recruiter dashboard KPIs' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                myJobOrders: { type: 'number' },
                myApplications: { type: 'number' },
                pendingInterviews: { type: 'number' },
                awaitingDecision: { type: 'number' },
                recentApplications: { type: 'array', items: { $ref: '#/components/schemas/Application' } },
            },
        },
    })
    dashboard(@GetUser() user: User): Promise<{ myJobOrders: number; myApplications: number; pendingInterviews: number; awaitingDecision: number; recentApplications: Application[] }> {
        return this.dashboardService.getRecruiterDashboard(user.id);
    }
}
