import { Inject, Injectable } from '@nestjs/common';
import { PG_CONNECTION } from '../constants';
import { Pool, QueryResult } from 'pg';
import path from 'node:path';
import sharp from 'sharp';

@Injectable()
export class LecturesService {
  constructor(@Inject(PG_CONNECTION) private conn: Pool) {}

  async addImage(
    file: Express.Multer.File,
    userId: number,
  ): Promise<{ success: boolean; imagePath?: string; publishDate?: string }> {
    const filePath: string = this.generateUniqueFileNameAvif();
    const { imagePath, publishDate } = await this.addImageToDB(
      filePath,
      userId,
    );
    const successConvert: boolean = await this.convertAndAddAvif(
      file.buffer,
      filePath,
    );
    if (imagePath && successConvert) {
      const correctImagePath: string = 'http://localhost:3000/' + imagePath;
      return {
        success: true,
        imagePath: correctImagePath,
        publishDate: publishDate,
      };
    } else {
      return { success: false };
    }
  }

  async addImageToDB(
    filePath: string,
    userId: number,
  ): Promise<{ imagePath: string; publishDate: string }> {
    try {
      const imageId: QueryResult<{ image_path: string; published_at: string }> =
        await this.conn.query(
          `INSERT INTO images (user_id, image_path) VALUES ($1, $2) RETURNING image_path, published_at`,
          [userId, filePath],
        );
      const imagePath: string = imageId.rows[0].image_path;
      const publishDate: string = imageId.rows[0].published_at;
      return {
        imagePath,
        publishDate,
      };
    } catch (e) {
      console.log('maybe no user_id in db', e);
      throw new Error(e);
    }
  }

  async convertAndAddAvif(
    buffer: Buffer<ArrayBufferLike>,
    filePath: string,
  ): Promise<boolean> {
    try {
      await sharp(buffer).avif().toFile(filePath);
      return true;
    } catch {
      return false;
    }
  }

  generateUniqueFileNameAvif(): string {
    const dateNow = new Date();
    const uniqueFileName: string =
      dateNow.getTime().toString() +
      Math.random().toString().replace('.', '') +
      '.avif';
    return path.join('images', uniqueFileName);
  }

  async createLecture({
    title,
    description,
  }: {
    title: string;
    description: string;
  }): Promise<{
    success: boolean;
    lectureId?: string;
  }> {
    try {
      const resultRaw: QueryResult<{ lecture_id: string }> =
        await this.conn.query(
          `INSERT INTO lectures (title, description) VALUES ($1, $2) RETURNING lecture_id;`,
          [title, description],
        );
      const lectureId = resultRaw?.rows[0]?.lecture_id;
      if (lectureId) {
        return {
          success: true,
          lectureId,
        };
      } else {
        throw new Error('error in bd when create lecture id');
      }
    } catch (error) {
      console.log('error in creating lecture id', error);
    }
    return {
      success: false,
    };
  }
}
