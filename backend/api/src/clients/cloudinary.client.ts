// src/clients/cloudinary.client.ts
import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';
import { Express } from 'express';

@Injectable()
export class CloudinaryClient {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'products' },
        (err: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (err) return reject(err);
          if (!result || !result.secure_url) {
            return reject(new Error('No se obtuvo secure_url de Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
