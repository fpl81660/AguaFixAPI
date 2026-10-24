import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { envs } from '../config/envs.js';

@Injectable()
export class StorageService {
  private readonly s3Client = new S3Client({ region: envs.storage.region });

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const bucket = envs.storage.bucket;
    if (!bucket) {
      throw new ServiceUnavailableException(
        'El almacenamiento de fotos no está configurado',
      );
    }

    const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const key = `${folder.replace(/^\/+|\/+$/g, '')}/${randomUUID()}.${extension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo subir la foto. Intenta nuevamente.',
      );
    }

    return `https://${bucket}.s3.${envs.storage.region}.amazonaws.com/${key}`;
  }
}
