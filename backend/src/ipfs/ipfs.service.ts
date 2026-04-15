/// <reference types="multer" />
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly pinataApiKey = process.env.PINATA_API_KEY;
  private readonly pinataSecretApiKey = process.env.PINATA_API_SECRET;

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    const data = new FormData();
    data.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}`,
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataSecretApiKey,
        },
      });

      return response.data.IpfsHash;
    } catch (error) {
      this.logger.error('IPFS File Upload Error:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to upload file to IPFS');
    }
  }

  async uploadJson(jsonData: any): Promise<string> {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    try {
      const response = await axios.post(url, jsonData, {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataSecretApiKey,
        },
      });

      return response.data.IpfsHash;
    } catch (error) {
      this.logger.error('IPFS JSON Upload Error:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to upload metadata JSON to IPFS');
    }
  }
}

