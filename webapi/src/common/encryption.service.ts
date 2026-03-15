import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const AES_256_GCM_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class EncryptionService {
    constructor(private readonly configService: ConfigService) { }

    encryptBuffer(plain: Buffer): Buffer {
        const key = this.getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(AES_256_GCM_ALGORITHM, key, iv);
        const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([iv, tag, encrypted]);
    }

    decryptBuffer(payload: Buffer): Buffer {
        if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH) {
            throw new InternalServerErrorException('Encrypted payload is invalid');
        }

        try {
            const key = this.getEncryptionKey();
            const iv = payload.subarray(0, IV_LENGTH);
            const tag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
            const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
            const decipher = crypto.createDecipheriv(AES_256_GCM_ALGORITHM, key, iv);

            decipher.setAuthTag(tag);

            return Buffer.concat([decipher.update(encrypted), decipher.final()]);
        } catch (err) {
            throw new InternalServerErrorException('Encrypted payload is invalid');
        }
    }

    encryptText(plainText: string): Buffer {
        return this.encryptBuffer(Buffer.from(plainText, 'utf8'));
    }

    decryptText(payload: Buffer): string {
        return this.decryptBuffer(payload).toString('utf8');

    }

    encryptJson(value: unknown): Buffer {
        return this.encryptText(JSON.stringify(value));
    }

    decryptJson<T>(payload: Buffer): T {
        return JSON.parse(this.decryptText(payload)) as T;
    }

    toBase64(payload: Buffer): string {
        return payload.toString('base64');
    }

    fromBase64(payload: string): Buffer {
        return Buffer.from(payload, 'base64');
    }

    private getEncryptionKey(): Buffer {
        const keyBase64 = this.configService.get<string>('FIELD_ENC_KEY');
        if (!keyBase64) {
            throw new InternalServerErrorException('FIELD_ENC_KEY is required');
        }

        const key = Buffer.from(keyBase64, 'base64');
        if (key.length !== 32) {
            throw new InternalServerErrorException('FIELD_ENC_KEY must be a 32-byte base64 value');
        }

        return key;
    }
}
