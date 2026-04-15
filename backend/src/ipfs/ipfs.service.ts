import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class IpfsService {
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
      console.error('IPFS Upload Error:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to upload to IPFS');
    }
  }
}
