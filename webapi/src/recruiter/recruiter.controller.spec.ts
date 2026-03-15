import { RecruiterController } from './recruiter.controller';
import { Role } from '../database/entities/user-role.entity';

describe('RecruiterController', () => {
    const makeController = () => {
        const jobOrdersService = {
            findAll: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
        } as any;

        const applicationsService = {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            updateStatus: jest.fn(),
            bulkImport: jest.fn(),
            findRecruiterCandidates: jest.fn(),
            findRecruiterCandidateById: jest.fn(),
            updateRecruiterCandidate: jest.fn(),
        } as any;

        const notificationsService = {
            findAll: jest.fn(),
            markAllRead: jest.fn(),
        } as any;

        const adminService = {
            listCompanies: jest.fn(),
            getCompanyById: jest.fn(),
            createCompany: jest.fn(),
            updateCompany: jest.fn(),
        } as any;

        const reportsService = {
            getJobOrderStats: jest.fn(),
            getApplicationStats: jest.fn(),
            getTopJobOrders: jest.fn(),
            getActivityTimeline: jest.fn(),
        } as any;

        const dashboardService = {
            getRecruiterDashboard: jest.fn(),
        } as any;

        const candidateRepository = {
            findOne: jest.fn(),
        } as any;

        const candidateProfileService = {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            addSkill: jest.fn(),
            updateSkill: jest.fn(),
            deleteSkill: jest.fn(),
            addWorkExperience: jest.fn(),
            updateWorkExperience: jest.fn(),
            deleteWorkExperience: jest.fn(),
            addEducation: jest.fn(),
            updateEducation: jest.fn(),
            deleteEducation: jest.fn(),
        } as any;

        const controller = new RecruiterController(
            jobOrdersService,
            applicationsService,
            notificationsService,
            adminService,
            reportsService,
            dashboardService,
            candidateRepository,
            candidateProfileService,
        );

        return {
            controller,
            jobOrdersService,
            applicationsService,
            notificationsService,
            adminService,
            reportsService,
            dashboardService,
            candidateRepository,
            candidateProfileService,
        };
    };

    it('requires recruiter role metadata', () => {
        const roles = Reflect.getMetadata('roles', RecruiterController);
        expect(roles).toEqual([Role.RECRUITER, Role.ADMIN]);
    });

    describe('candidate endpoints', () => {
        it('listCandidates delegates to applicationsService.findRecruiterCandidates', () => {
            const { controller, applicationsService } = makeController();
            const expected = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
            applicationsService.findRecruiterCandidates.mockReturnValue(expected);

            const user = { id: 'rec-1' } as any;
            const result = controller.listCandidates(user, '2', '10', 'new', 'jo-1', 'alice', 'Calgary');

            expect(applicationsService.findRecruiterCandidates).toHaveBeenCalledWith('rec-1', {
                page: 2,
                limit: 10,
                status: 'new',
                jobOrderId: 'jo-1',
                search: 'alice',
                location: 'Calgary',
            });
            expect(result).toBe(expected);
        });

        it('getCandidate delegates to applicationsService.findRecruiterCandidateById', () => {
            const { controller, applicationsService } = makeController();
            const expected = { id: 'app-1' };
            applicationsService.findRecruiterCandidateById.mockReturnValue(expected);

            const result = controller.getCandidate({ id: 'rec-1' } as any, 'app-1');

            expect(applicationsService.findRecruiterCandidateById).toHaveBeenCalledWith('rec-1', 'app-1');
            expect(result).toBe(expected);
        });

        it('updateCandidate delegates to applicationsService.updateRecruiterCandidate', () => {
            const { controller, applicationsService } = makeController();
            const dto = { nickname: 'NewName', status: 'interview' } as any;
            const expected = { id: 'app-1', status: 'interview' };
            applicationsService.updateRecruiterCandidate.mockReturnValue(expected);

            const result = controller.updateCandidate({ id: 'rec-1' } as any, 'app-1', dto);

            expect(applicationsService.updateRecruiterCandidate).toHaveBeenCalledWith('rec-1', 'app-1', dto);
            expect(result).toBe(expected);
        });
    });

    describe('company endpoints', () => {
        it('listCompanies delegates to adminService.listCompanies', () => {
            const { controller, adminService } = makeController();
            const expected = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
            adminService.listCompanies.mockReturnValue(expected);

            const result = controller.listCompanies('3', '15', 'abc');

            expect(adminService.listCompanies).toHaveBeenCalledWith(3, 15, 'abc');
            expect(result).toBe(expected);
        });

        it('getCompanyById delegates to adminService.getCompanyById', () => {
            const { controller, adminService } = makeController();
            const expected = { id: 'co-1' };
            adminService.getCompanyById.mockReturnValue(expected);

            const result = controller.getCompanyById('co-1');

            expect(adminService.getCompanyById).toHaveBeenCalledWith('co-1');
            expect(result).toBe(expected);
        });

        it('createCompany delegates to adminService.createCompany', () => {
            const { controller, adminService } = makeController();
            const dto = { name: 'Acme' } as any;
            const expected = { id: 'co-1', name: 'Acme' };
            adminService.createCompany.mockReturnValue(expected);

            const user = { email: 'rec@test.com', nickname: 'Rec' } as any;
            const result = controller.createCompany(user, dto);

            expect(adminService.createCompany).toHaveBeenCalledWith(dto, 'Rec');
            expect(result).toBe(expected);
        });

        it('updateCompany delegates to adminService.updateCompany', () => {
            const { controller, adminService } = makeController();
            const dto = { name: 'Acme 2' } as any;
            const expected = { id: 'co-1', name: 'Acme 2' };
            adminService.updateCompany.mockReturnValue(expected);

            const result = controller.updateCompany('co-1', dto);

            expect(adminService.updateCompany).toHaveBeenCalledWith('co-1', dto);
            expect(result).toBe(expected);
        });
    });
});
