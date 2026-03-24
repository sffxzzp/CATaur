import { ApiProperty } from '@nestjs/swagger';

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
