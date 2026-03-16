import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EmailService } from '../common/email.service';
import { UlidService } from '../common/ulid.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Passkey } from '../database/entities/passkey.entity';
import { AuthAttemptsService } from './auth-attempts.service';
import { CaptchaService } from './captcha.service';
import * as bcrypt from 'bcrypt';



describe('AuthService', () => {
    let service: AuthService;
    let usersService: any;
    let jwtService: any;
    let cacheManager: any;
    let emailService: any;
    let ulidService: any;
    let authAttemptsService: any;
    let captchaService: any;

    beforeEach(async () => {
        const mockUsersService = {
            findOneByEmail: jest.fn(),
            findOneById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        };
        const mockJwtService = {
            sign: jest.fn(),
        };
        const mockCacheManager = {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
        };
        const mockEmailService = {
            sendVerificationEmail: jest.fn(),
            sendVerificationCodeEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
            sendPasswordChangedNotification: jest.fn(),
        };
        const mockUlidService = {
            generate: jest.fn().mockReturnValue('MOCK_TOKEN'),
        };
        const mockAuthAttemptsService = {
            checkEmailActionAllowed: jest.fn(),
            getLoginState: jest.fn().mockResolvedValue({ locked: false }),
            recordFailedAttempt: jest.fn(),
            recordSuccessfulAttempt: jest.fn(),
            recordFailure: jest.fn(),
            recordSuccess: jest.fn(),
        };
        const mockCaptchaService = {
            verifyToken: jest.fn().mockResolvedValue(true),
            verifyCaptcha: jest.fn().mockResolvedValue(true),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
                { provide: EmailService, useValue: mockEmailService },
                { provide: UlidService, useValue: mockUlidService },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config = {
                                WEBAUTHN_ORIGIN: 'http://localhost:3000',
                                WEBAUTHN_RP_NAME: 'CATaur',
                                WEBAUTHN_RP_ID: 'localhost',
                            };
                            return config[key] || undefined;
                        }),
                    },
                },
                {
                    provide: getRepositoryToken(Passkey),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        find: jest.fn(),
                    },
                },
                { provide: AuthAttemptsService, useValue: mockAuthAttemptsService },
                { provide: CaptchaService, useValue: mockCaptchaService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
        cacheManager = module.get(CACHE_MANAGER);
        emailService = module.get(EmailService);
        ulidService = module.get(UlidService);
        authAttemptsService = module.get(AuthAttemptsService);
        captchaService = module.get(CaptchaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });


    describe('verifyEmail', () => {
        it('should activate user and delete token if valid', async () => {
            const token = 'valid_token';
            const email = 'test@example.com';
            const user = { id: '1', email, isActive: false };

            cacheManager.get.mockResolvedValue(email);
            usersService.findOneByEmail.mockResolvedValue(user);

            await service.verifyEmail(token);

            expect(usersService.update).toHaveBeenCalledWith(user.id, { isActive: true });
            expect(cacheManager.del).toHaveBeenCalledWith(`verify_email:${token}`);
        });

        it('should throw BadRequestException if token is invalid', async () => {
            cacheManager.get.mockResolvedValue(null);
            await expect(service.verifyEmail('invalid')).rejects.toThrow('Invalid or expired verification token');
        });
    });


    describe('login', () => {
        it('should return an access token', async () => {
            const user = { id: 1, email: 'test@example.com' };
            const token = 'signed_jwt_token';

            jwtService.sign.mockReturnValue(token);

            const result = await service.login(user as any);
            expect(result).toEqual({
                access_token: token,
                userId: user.id,
                email: user.email,
                roles: [],
            });
            expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id });
        });
    });

    describe('loginWithPassword', () => {
        it('should login successfully with valid email and password', async () => {
            const email = 'test@example.com';
            const password = 'password123';
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = { id: '1', email, passwordHash: hashedPassword, isActive: true };
            const token = 'signed_jwt_token';

            usersService.findOneByEmail.mockResolvedValue(user);
            jwtService.sign.mockReturnValue(token);

            const result = await service.loginWithPassword(email, password);

            expect(result).toEqual({
                access_token: token,
                userId: user.id,
                email: user.email,
                roles: [],
            });
        });

        it('should throw UnauthorizedException if user does not exist', async () => {
            usersService.findOneByEmail.mockResolvedValue(null);

            await expect(service.loginWithPassword('nonexistent@example.com', 'password123')).rejects.toThrow(
                'Invalid email or password',
            );
        });

        it('should throw UnauthorizedException if user is not active', async () => {
            const user = { id: '1', email: 'test@example.com', isActive: false };
            usersService.findOneByEmail.mockResolvedValue(user);

            await expect(service.loginWithPassword('test@example.com', 'password123')).rejects.toThrow(
                'Invalid email or password',
            );
        });

        it('should throw UnauthorizedException if password is invalid', async () => {
            const user = { id: '1', email: 'test@example.com', passwordHash: 'hashed_invalid', isActive: true };
            usersService.findOneByEmail.mockResolvedValue(user);

            await expect(service.loginWithPassword('test@example.com', 'wrongpassword')).rejects.toThrow(
                'Invalid email or password',
            );
        });

        it('should throw UnauthorizedException if passwordHash is not set', async () => {
            const user = { id: '1', email: 'test@example.com', passwordHash: '', isActive: true };
            usersService.findOneByEmail.mockResolvedValue(user);

            await expect(service.loginWithPassword('test@example.com', 'password123')).rejects.toThrow(
                'Password login not enabled for this account',
            );
        });
    });

    describe('setPassword', () => {
        it('should hash and set password', async () => {
            const userId = 'user_id';
            const password = 'newPassword123';

            await service.setPassword(userId, password);

            expect(usersService.update).toHaveBeenCalledWith(userId, {
                passwordHash: expect.any(String),
            });
        });
    });

    describe('changePassword', () => {
        it('should successfully change password with valid old password', async () => {
            const userId = 'user_id';
            const oldPassword = 'oldPassword123';
            const newPassword = 'newPassword123';
            const hashedOldPassword = await bcrypt.hash(oldPassword, 10);
            const user = {
                id: userId,
                email: 'test@example.com',
                passwordHash: hashedOldPassword,
            };

            usersService.findOneById.mockResolvedValue(user);

            await service.changePassword(userId, oldPassword, newPassword);

            expect(usersService.update).toHaveBeenCalledWith(userId, {
                passwordHash: expect.any(String),
            });
            expect(emailService.sendPasswordChangedNotification).toHaveBeenCalledWith(user.email);
        });

        it('should throw NotFoundException if user not found', async () => {
            usersService.findOneById.mockResolvedValue(null);

            await expect(service.changePassword('nonexistent_id', 'old', 'new')).rejects.toThrow('User not found');
        });

        it('should throw BadRequestException if password not set', async () => {
            const user = { id: 'user_id', email: 'test@example.com', passwordHash: '' };
            usersService.findOneById.mockResolvedValue(user);

            await expect(service.changePassword('user_id', 'old', 'new')).rejects.toThrow(
                'Password not set for this account',
            );
        });

        it('should throw UnauthorizedException if old password is invalid', async () => {
            const user = {
                id: 'user_id',
                email: 'test@example.com',
                passwordHash: 'invalid_hash',
            };
            usersService.findOneById.mockResolvedValue(user);

            await expect(service.changePassword('user_id', 'wrongold', 'newpass')).rejects.toThrow(
                'Invalid current password',
            );
        });
    });

    describe('requestPasswordReset', () => {
        it('should generate reset token and send email for valid user', async () => {
            const email = 'test@example.com';
            const user = { id: 'user_id', email, isActive: true };

            usersService.findOneByEmail.mockResolvedValue(user);

            await service.requestPasswordReset(email);

            expect(cacheManager.set).toHaveBeenCalledWith(
                'password_reset:MOCK_TOKEN',
                email,
                1800000,
            );
            expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
                email,
                expect.stringContaining('/auth/reset-password?token='),
            );
        });

        it('should not throw error if user does not exist (for security)', async () => {
            usersService.findOneByEmail.mockResolvedValue(null);

            await expect(service.requestPasswordReset('nonexistent@example.com')).resolves.not.toThrow();
        });

        it('should not throw error if user is inactive (for security)', async () => {
            const user = { id: 'user_id', email: 'test@example.com', isActive: false };
            usersService.findOneByEmail.mockResolvedValue(user);

            await expect(service.requestPasswordReset('test@example.com')).resolves.not.toThrow();
        });
    });

    describe('resetPassword', () => {
        it('should reset password with valid token', async () => {
            const token = 'valid_reset_token';
            const newPassword = 'newPassword123';
            const email = 'test@example.com';
            const user = {
                id: 'user_id',
                email,
            };

            cacheManager.get.mockResolvedValue(email);
            usersService.findOneByEmail.mockResolvedValue(user);

            await service.resetPassword(token, newPassword);

            expect(usersService.update).toHaveBeenCalledWith('user_id', {
                passwordHash: expect.any(String),
            });
            expect(cacheManager.del).toHaveBeenCalledWith('password_reset:valid_reset_token');
            expect(emailService.sendPasswordChangedNotification).toHaveBeenCalledWith(user.email);
        });

        it('should throw BadRequestException if token not found', async () => {
            cacheManager.get.mockResolvedValue(null);

            await expect(service.resetPassword('invalid_token', 'newpass')).rejects.toThrow(
                'Invalid or expired reset token',
            );
        });
    });

    describe('requestVerificationCode', () => {
        it('should generate code and send email for valid user', async () => {
            const email = 'test@example.com';
            const user = { id: 'user_id', email, isActive: true };

            usersService.findOneByEmail.mockResolvedValue(user);

            await service.requestVerificationCode(email);

            expect(cacheManager.set).toHaveBeenCalledWith(
                `verification_code:${email}`,
                expect.stringMatching(/^\d{6}$/),
                300000,
            );
            expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledWith(email, expect.any(String));
        });

        it('should not throw error if user does not exist (for security)', async () => {
            usersService.findOneByEmail.mockResolvedValue(null);

            await expect(service.requestVerificationCode('nonexistent@example.com')).resolves.not.toThrow();
        });

        it('should not throw error if user is inactive (for security)', async () => {
            const user = { id: 'user_id', email: 'test@example.com', isActive: false };
            usersService.findOneByEmail.mockResolvedValue(user);

            await expect(service.requestVerificationCode('test@example.com')).resolves.not.toThrow();
        });
    });

    describe('loginWithVerificationCode', () => {
        it('should login successfully with valid email and code', async () => {
            const email = 'test@example.com';
            const code = '123456';
            const user = { id: 'user_id', email, isActive: true };
            const token = 'signed_jwt_token';

            usersService.findOneByEmail.mockResolvedValue(user);
            cacheManager.get.mockResolvedValue(code);
            jwtService.sign.mockReturnValue(token);

            const result = await service.loginWithVerificationCode(email, code);

            expect(result).toEqual({
                access_token: token,
                userId: user.id,
                email: user.email,
                roles: [],
            });
            expect(cacheManager.del).toHaveBeenCalledWith(`verification_code:${email}`);
        });

        it('should throw UnauthorizedException if user does not exist', async () => {
            usersService.findOneByEmail.mockResolvedValue(null);

            await expect(service.loginWithVerificationCode('nonexistent@example.com', '123456')).rejects.toThrow(
                'Invalid email or verification code',
            );
        });

        it('should throw UnauthorizedException if user is not active', async () => {
            const user = { id: 'user_id', email: 'test@example.com', isActive: false };
            usersService.findOneByEmail.mockResolvedValue(user);

            await expect(service.loginWithVerificationCode('test@example.com', '123456')).rejects.toThrow(
                'Invalid email or verification code',
            );
        });

        it('should throw UnauthorizedException if code not found', async () => {
            const user = { id: 'user_id', email: 'test@example.com', isActive: true };
            usersService.findOneByEmail.mockResolvedValue(user);
            cacheManager.get.mockResolvedValue(null);

            await expect(service.loginWithVerificationCode('test@example.com', '123456')).rejects.toThrow(
                'Invalid email or verification code',
            );
        });

        it('should throw UnauthorizedException if code is invalid', async () => {
            const email = 'test@example.com';
            const user = { id: 'user_id', email, isActive: true };
            usersService.findOneByEmail.mockResolvedValue(user);
            cacheManager.get.mockResolvedValue('654321');

            await expect(service.loginWithVerificationCode(email, '123456')).rejects.toThrow(
                'Invalid email or verification code',
            );
        });
    });
});
