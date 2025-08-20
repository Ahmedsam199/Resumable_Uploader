import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CaseDTO } from './case.DTO';

@Injectable()
export class CaseService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Function to get all cases
   */
  async getCases() {
    try {
      return await this.prisma.case.findMany({
        orderBy: { id: 'desc' },
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to fetch cases',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Function to create new cases
   */
  async createCase(data: CaseDTO) {
    try {
      return await this.prisma.case.create({ data });
    } catch (error) {
      throw new HttpException('Failed to create case', HttpStatus.BAD_REQUEST);
    }
  }
  /**
   * Function to retreive single case from id
   */
  async getCaseById(id: number) {
    try {
      const caseRecord = await this.prisma.case.findUnique({
        where: { id },
        include: { Document: true },
      });

      if (!caseRecord) {
        throw new HttpException('Case not found', HttpStatus.NOT_FOUND);
      }

      return caseRecord;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch case by ID',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
