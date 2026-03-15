import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { ConfigService } from '@nestjs/config';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import sharp from 'sharp';
import { Response } from 'express';
import { createHmac } from 'crypto';

// Mock dependencies
jest.mock('axios');
jest.mock('sharp');

describe('FilesController', () => {
    let controller: FilesController;
    let configService: ConfigService;

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'SEAWEEDFS_FILER_URL') return 'http://mock-filer:8888';
            if (key === 'UPLOAD_API_KEY') return 'test-secret';
            if (key === 'UPLOAD_LINK_EXPIRES_IN') return 3600;
            if (key === 'ACCESS_KEY') return 'test-access-key';
            return null;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FilesController],
            providers: [
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        controller = module.get<FilesController>(FilesController);
        configService = module.get<ConfigService>(ConfigService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getUploadUrl', () => {
        it('should return upload URL and signed params when key is valid', async () => {
            const filename = 'test.png';
            const accessKey = 'test-access-key';
            const result = await controller.getUploadUrl(filename, accessKey);

            expect(result).toHaveProperty('uploadUrl', '/files/upload');
            expect(result.params).toHaveProperty('filename', filename);
            expect(result.params).toHaveProperty('expires');
            expect(result.params).toHaveProperty('signature');

            const expectedSignature = createHmac('sha256', 'test-secret')
                .update(`${filename}:${result.params.expires}`)
                .digest('hex');
            expect(result.params.signature).toBe(expectedSignature);
        });

        it('should throw UnauthorizedException if key is missing', async () => {
            await expect(
                controller.getUploadUrl('test.png', undefined as any),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if key is invalid', async () => {
            await expect(
                controller.getUploadUrl('test.png', 'wrong-key'),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('upload', () => {
        const filename = 'test.png';
        const secret = 'test-secret';

        const getValidParams = (fname = filename) => {
            const expires = Math.floor(Date.now() / 1000) + 3600;
            const signature = createHmac('sha256', secret)
                .update(`${fname}:${expires}`)
                .digest('hex');
            return { filename: fname, expires: expires.toString(), signature };
        };

        it('should throw UnauthorizedException if URL is expired', async () => {
            const expires = Math.floor(Date.now() / 1000) - 10;
            const signature = createHmac('sha256', secret)
                .update(`${filename}:${expires}`)
                .digest('hex');

            await expect(
                controller.upload(filename, expires.toString(), signature, undefined),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if signature is invalid', async () => {
            const params = getValidParams();
            await expect(
                controller.upload(filename, params.expires, 'invalid-sig', undefined),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw HttpException if no file is provided', async () => {
            const params = getValidParams();
            await expect(
                controller.upload(filename, params.expires, params.signature, undefined),
            ).rejects.toThrow(new HttpException('No file', 400));
        });

        it('should upload a non-image file successfully', async () => {
            const txtFilename = 'test.txt';
            const params = getValidParams(txtFilename);
            const file = {
                buffer: Buffer.from('test content'),
                originalname: txtFilename,
                mimetype: 'text/plain',
            } as Express.Multer.File;

            (axios.post as jest.Mock).mockResolvedValue({ status: 201 });

            const result = await controller.upload(
                txtFilename,
                params.expires,
                params.signature,
                file,
            );

            expect(axios.post).toHaveBeenCalled();
            expect(result.url).toContain('/files/view/');
            expect(result.mimetype).toBe('text/plain');
        });

        it('should process and upload an image file as AVIF successfully', async () => {
            const params = getValidParams();
            const file = {
                buffer: Buffer.from('image content'),
                originalname: 'test.png',
                mimetype: 'image/png',
            } as Express.Multer.File;

            const mockBuffer = Buffer.from('avif image');
            const sharpMock = {
                avif: jest.fn().mockReturnThis(),
                toBuffer: jest.fn().mockResolvedValue(mockBuffer),
            };
            (sharp as unknown as jest.Mock).mockReturnValue(sharpMock);

            (axios.post as jest.Mock).mockResolvedValue({ status: 201 });

            const result = await controller.upload(
                filename,
                params.expires,
                params.signature,
                file,
            );

            expect(sharp).toHaveBeenCalledWith(file.buffer);
            expect(sharpMock.avif).toHaveBeenCalledWith(
                expect.objectContaining({ quality: 85 }),
            );
            expect(axios.post).toHaveBeenCalled();
            expect(result.url).toMatch(/\.avif$/);
            expect(result.mimetype).toBe('image/avif');
        });

        it('should throw SeaweedFS Upload Error if upload fails', async () => {
            const params = getValidParams();
            const file = {
                buffer: Buffer.from('test content'),
                originalname: 'test.txt',
                mimetype: 'text/plain',
            } as Express.Multer.File;

            (axios.post as jest.Mock).mockRejectedValue(new Error('Upload failed'));

            await expect(
                controller.upload(filename, params.expires, params.signature, file),
            ).rejects.toThrow(new HttpException('SeaweedFS Upload Error', 500));
        });
    });

    describe('view', () => {
        it('should pipe the file stream to response on success', async () => {
            const mockStream = {
                headers: { 'content-type': 'text/plain' },
                data: {
                    pipe: jest.fn(),
                },
            };
            const res = {
                setHeader: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as unknown as Response;

            (axios as unknown as jest.Mock).mockResolvedValue(mockStream);

            await controller.view('test.txt', res);

            expect(axios).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: expect.stringContaining('/uploads/test.txt'),
                    method: 'GET',
                    responseType: 'stream',
                }),
            );
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
            expect(mockStream.data.pipe).toHaveBeenCalledWith(res);
        });

        it('should respond with 404 if file not found', async () => {
            const res = {
                setHeader: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as unknown as Response;

            (axios as unknown as jest.Mock).mockRejectedValue(new Error('Not found'));

            await controller.view('nonexistent.txt', res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Not Found');
        });
    });

    describe('download', () => {
        it('should set attachment headers and pipe stream to response on success', async () => {
            const mockStream = {
                headers: { 'content-type': 'application/pdf' },
                data: {
                    pipe: jest.fn(),
                },
            };
            const res = {
                setHeader: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as unknown as Response;

            (axios as unknown as jest.Mock).mockResolvedValue(mockStream);

            await controller.download('resume.pdf', res);

            expect(axios).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: expect.stringContaining('/uploads/resume.pdf'),
                    method: 'GET',
                    responseType: 'stream',
                }),
            );
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename="resume.pdf"',
            );
            expect(mockStream.data.pipe).toHaveBeenCalledWith(res);
        });

        it('should respond with 404 if file not found', async () => {
            const res = {
                setHeader: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as unknown as Response;

            (axios as unknown as jest.Mock).mockRejectedValue(new Error('Not found'));

            await controller.download('nonexistent.pdf', res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Not Found');
        });
    });
});
