import { ApiProperty } from '@nestjs/swagger';
import { JobOrder } from '../../database/entities/job-order.entity';

export class ClientJobOrder {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty({ required: false })
    locationCountry: string | null;

    @ApiProperty({ required: false })
    locationState: string | null;

    @ApiProperty({ required: false })
    locationCity: string | null;

    @ApiProperty({ required: false })
    employmentType: string | null;

    @ApiProperty()
    status: string;

    @ApiProperty()
    candidateCount: number;

    @ApiProperty()
    createdAt: Date;
}

export class ClientJobOrderDetail extends JobOrder {
    @ApiProperty({ description: 'Number of applications submitted for this job order' })
    submitted: number;

    @ApiProperty()
    declare createdAt: Date;

    @ApiProperty()
    declare updatedAt: Date;
}
