import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/entities/user-role.entity';
import { UlidService } from '../common/ulid.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EncryptionService } from '../common/encryption.service';



describe('UsersService', () => {
    let service: UsersService;
    let repository: any;
    let ulidService: UlidService;

    beforeEach(async () => {
        const mockRepository = {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        const mockUlidService = {
            generate: jest.fn().mockReturnValue('01ARZ3NDEKTSV4RRFFQ69G5FAV'),
        };

        const mockRoleRepository = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
            delete: jest.fn().mockResolvedValue({}),
        };

        const mockCacheManager = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        };

        const mockEncryptionService = {
            encryptText: jest.fn((v: string) => Buffer.from(v, 'utf8')),
            decryptText: jest.fn((b: Buffer) => b.toString('utf8')),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: mockRepository },
                { provide: getRepositoryToken(UserRole), useValue: mockRoleRepository },
                { provide: UlidService, useValue: mockUlidService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
                { provide: EncryptionService, useValue: mockEncryptionService },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get(getRepositoryToken(User));
        ulidService = module.get<UlidService>(UlidService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findOneByEmail', () => {
        it('should call repository.findOne with correct params', async () => {
            const email = 'test@example.com';
            repository.findOne.mockResolvedValue({ email } as User);

            const result = await service.findOneByEmail(email);

            expect(result).toBeDefined();
            expect(result!.email).toEqual(email);
            expect(repository.findOne).toHaveBeenCalledWith({
                where: { email },
                relations: ['roles'],
            });
        });
    });

    describe('create', () => {
        it('should hash password and save user', async () => {
            const userData = { email: 'test@example.com', passwordHash: 'hashed_password_123' };
            const generatedId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
            const createdUser = { id: generatedId, ...userData, isActive: false, createdAt: new Date() };

            repository.create.mockReturnValue(createdUser);
            repository.save.mockResolvedValue(createdUser);
            // create() internally calls findOneById after saving roles
            repository.findOne.mockResolvedValue(createdUser);

            const result = await service.create(userData);

            expect(result).toEqual(createdUser);
            expect(repository.create).toHaveBeenCalledWith({
                id: generatedId,
                ...userData,
            });
            expect(repository.save).toHaveBeenCalledWith(createdUser);
        });

        it('should save user with password hash', async () => {
            const userData = { email: 'test@example.com', passwordHash: 'hashed_password' };
            const generatedId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
            const createdUser = { id: generatedId, ...userData };

            repository.create.mockReturnValue(createdUser);
            repository.save.mockResolvedValue(createdUser);
            // create() internally calls findOneById after saving roles
            repository.findOne.mockResolvedValue(createdUser);

            const result = await service.create(userData);

            expect(result).toEqual(createdUser);
            expect(repository.create).toHaveBeenCalledWith({
                id: generatedId,
                ...userData,
            });
            expect(repository.save).toHaveBeenCalledWith(createdUser);
        });
    });

    describe('update', () => {
        it('should update user and return updated user', async () => {
            const id = 'user_id';
            const updateData = { isActive: true };
            const updatedUser = { id, email: 'test@example.com', ...updateData };

            repository.update = jest.fn().mockResolvedValue({ affected: 1 });
            repository.findOne.mockResolvedValue(updatedUser);

            const result = await service.update(id, updateData);

            expect(result).toEqual(updatedUser);
            expect(repository.update).toHaveBeenCalledWith(id, updateData);
            expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
        });
    });

    describe('findOneById', () => {
        it('should find user by id', async () => {
            const id = 'user_id';
            const user = { id, email: 'test@example.com' };
            repository.findOne.mockResolvedValue(user);

            const result = await service.findOneById(id);

            expect(result).toEqual(user);
            expect(repository.findOne).toHaveBeenCalledWith({
                where: { id },
                relations: ['roles'],
            });
        });

        it('should return null if user not found by id', async () => {
            repository.findOne.mockResolvedValue(null);

            const result = await service.findOneById('nonexistent_id');

            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return all users with roles', async () => {
            const users = [{ id: 'u1' }, { id: 'u2' }];
            repository.find.mockResolvedValue(users);

            const result = await service.findAll();

            expect(result).toEqual(users);
            expect(repository.find).toHaveBeenCalledWith({ relations: ['roles'] });
        });
    });
});
