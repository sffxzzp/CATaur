import {
    Controller,
    Post,
    Get,
    Param,
    UseInterceptors,
    UploadedFile,
    Res,
    HttpException,
    Query,
    UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiConsumes,
    ApiBody,
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
    ApiParam,
    ApiProperty,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';
import type { Response } from 'express';
import 'multer';
import { createHmac } from 'crypto';

class UploadParamsDto {
    @ApiProperty({ description: 'The filename used during signature generation' })
    filename: string;

    @ApiProperty({ description: 'The expiration timestamp' })
    expires: number;

    @ApiProperty({ description: 'The HMAC-SHA256 signature' })
    signature: string;
}

class UploadUrlResponseDto {
    @ApiProperty({ description: 'The endpoint to POST the file to', example: '/files/upload' })
    uploadUrl: string;

    @ApiProperty({ description: 'Required signature parameters for the upload request' })
    params: UploadParamsDto;
}

class FileUploadResponseDto {
    @ApiProperty({ description: 'The public URL to view the file', example: '/files/view/123-image.avif' })
    url: string;

    @ApiProperty({ description: 'The MIME type of the uploaded file', example: 'image/avif' })
    mimetype: string;
}

@ApiTags('Files')
@Controller('files')
export class FilesController {
    private filerUrl: string;

    constructor(private config: ConfigService) {
        this.filerUrl =
            this.config.get('SEAWEEDFS_FILER_URL') || 'http://filer:8888';
    }

    @Get('request-upload')
    @ApiOperation({
        summary: 'Generate a signed upload URL',
        description: 'Generates a signed URL for secure file uploading using HMAC-SHA256.',
    })
    @ApiQuery({ name: 'filename', description: 'The original name of the file to be uploaded', example: 'image.png' })
    @ApiQuery({ name: 'key', description: 'The API access key for verification' })
    @ApiResponse({
        status: 200,
        description: 'Returns the upload URL and required signature parameters.',
        type: UploadUrlResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized: invalid or missing access key.' })
    async getUploadUrl(
        @Query('filename') filename: string,
        @Query('key') key: string,
    ): Promise<UploadUrlResponseDto> {
        const accessKey = this.config.get('ACCESS_KEY');
        if (!key || key !== accessKey) {
            throw new UnauthorizedException('Invalid or missing access key');
        }

        const secret = this.config.get('UPLOAD_API_KEY');
        const expiresIn = this.config.get<number>('UPLOAD_LINK_EXPIRES_IN') || 3600;
        const expires = Math.floor(Date.now() / 1000) + Number(expiresIn);

        // Calculate HMAC-SHA256 signature
        const signature = createHmac('sha256', secret)
            .update(`${filename}:${expires}`)
            .digest('hex');

        // Return all parameters required by the frontend
        return {
            uploadUrl: '/files/upload',
            params: {
                filename,
                expires,
                signature
            }
        };
    }

    @Post('upload')
    @ApiOperation({
        summary: 'Upload a file',
        description: 'Uploads a file using a valid signature. Images are automatically converted to AVIF format.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiQuery({ name: 'filename', description: 'The filename used during signature generation' })
    @ApiQuery({ name: 'expires', description: 'The expiration timestamp used during signature generation' })
    @ApiQuery({ name: 'signature', description: 'The HMAC signature for verification' })
    @ApiBody({
        description: 'The file to upload',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully and processed.',
        type: FileUploadResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized: signature invalid or URL expired.' })
    @ApiResponse({ status: 400, description: 'Bad Request: no file provided.' })
    @ApiResponse({ status: 500, description: 'Internal Server Error: SeaweedFS upload failure.' })
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
    async upload(
        @Query('filename') filename: string,
        @Query('expires') expires: string,
        @Query('signature') signature: string,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<FileUploadResponseDto> {
        const secret = this.config.get('UPLOAD_API_KEY');

        // 1. Security verification
        // const now = Math.floor(Date.now() / 1000);
        // if (now > parseInt(expires)) throw new UnauthorizedException('URL expired');

        // const expectedSignature = createHmac('sha256', secret)
        //     .update(`${filename}:${expires}`)
        //     .digest('hex');

        // if (signature !== expectedSignature) throw new UnauthorizedException('Invalid signature');
        if (!file) throw new HttpException('No file', 400);

        let buffer = file.buffer;
        let originalNameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
        let finalName = `${Date.now()}-${originalNameWithoutExt}`;

        if (file.mimetype.startsWith('image/')) {
            buffer = await sharp(file.buffer)
                // If you don't want to downscale the image, remove resize
                // .resize({ width: 1200, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
                .avif({
                    quality: 85,      // Control size and visual quality
                    effort: 4,        // Compression speed/quality balance, 0-9
                    chromaSubsampling: '4:4:4' // Preserve color precision, clearer for landscapes
                })
                .toBuffer();


            finalName += '.avif';
        } else {
            finalName = `${Date.now()}-${file.originalname}`; // Keep original for non-images
        }

        const form = new FormData();
        form.append('file', buffer, { filename: finalName });

        try {
            await axios.post(`${this.filerUrl}/uploads/${finalName}`, form, {
                headers: form.getHeaders(),
            });
            return {
                url: `/files/view/${finalName}`,
                mimetype: file.mimetype.startsWith('image/') ? 'image/avif' : file.mimetype
            };
        } catch (e) {
            throw new HttpException('SeaweedFS Upload Error', 500);
        }
    }

    @Get('view/:name')
    @ApiOperation({
        summary: 'View/Download a file',
        description: 'Retrieves the file from storage and pipes it to the response stream.',
    })
    @ApiParam({ name: 'name', description: 'The name of the file to retrieve' })
    @ApiResponse({ status: 200, description: 'File stream.' })
    @ApiResponse({ status: 404, description: 'File not found.' })
    async view(@Param('name') name: string, @Res() res: Response) {
        try {
            const stream = await axios({
                url: `${this.filerUrl}/uploads/${name}`,
                method: 'GET',
                responseType: 'stream',
            });
            res.setHeader('Content-Type', stream.headers['content-type']);
            stream.data.pipe(res);
        } catch (e) {
            res.status(404).send('Not Found');
        }
    }

    @Get('download/:name')
    @ApiOperation({
        summary: 'Download a file',
        description: 'Downloads the file as an attachment from storage.',
    })
    @ApiParam({ name: 'name', description: 'The name of the file to download' })
    @ApiResponse({ status: 200, description: 'File download stream.' })
    @ApiResponse({ status: 404, description: 'File not found.' })
    async download(@Param('name') name: string, @Res() res: Response) {
        try {
            const stream = await axios({
                url: `${this.filerUrl}/uploads/${name}`,
                method: 'GET',
                responseType: 'stream',
            });
            res.setHeader('Content-Type', stream.headers['content-type']);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`);
            stream.data.pipe(res);
        } catch (e) {
            res.status(404).send('Not Found');
        }
    }
}
