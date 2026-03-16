import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let usersService: any;
    let cacheManager: any;

    beforeEach(async () => {
        const mockUsersService = {
            findOneByEmail: jest.fn(),
        };
        const mockConfigService = {
            getOrThrow: jest.fn().mockReturnValue('test_secret'),
            get: jest.fn().mockReturnValue('test_secret'),
        };
        const mockCacheManager = {
            get: jest.fn(),
            set: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                { provide: UsersService, useValue: mockUsersService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
            ],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
        usersService = module.get<UsersService>(UsersService);
        cacheManager = module.get(CACHE_MANAGER);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    describe('validate', () => {
        const payload = { sub: 1, email: 'test@example.com' };
        const user = { id: 1, email: 'test@example.com', isActive: true };
        const dbUserWithPassword = { id: 1, email: 'test@example.com', isActive: true, passwordHash: 'hashed_password', createdAt: new Date() };

        it('should return user from cache if present', async () => {
            cacheManager.get.mockResolvedValue(user);

            const result = await strategy.validate(payload);

            expect(result).toEqual(user);
            expect(cacheManager.get).toHaveBeenCalledWith(`auth_user_${payload.email}`);
            expect(usersService.findOneByEmail).not.toHaveBeenCalled();
        });

        it('should fetch user from database if not in cache and store in cache', async () => {
            cacheManager.get.mockResolvedValue(null);
            usersService.findOneByEmail.mockResolvedValue(dbUserWithPassword);

            const result = await strategy.validate(payload);

            expect(result).toEqual(dbUserWithPassword);
            expect(usersService.findOneByEmail).toHaveBeenCalledWith(payload.email);
            expect(cacheManager.set).toHaveBeenCalledWith(`auth_user_${payload.email}`, dbUserWithPassword, 600 * 1000);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            cacheManager.get.mockResolvedValue(null);
            usersService.findOneByEmail.mockResolvedValue(null);

            await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
        });
    });
});
