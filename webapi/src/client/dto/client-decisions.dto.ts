import { ApiProperty } from '@nestjs/swagger';

export class ClientDecisionItem {
    @ApiProperty()
    candidateName: string;

    @ApiProperty()
    candidateEmail: string;

    @ApiProperty()
    jobOrderTitle: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ required: false })
    locationCountry: string | null;

    @ApiProperty({ required: false })
    locationState: string | null;

    @ApiProperty({ required: false })
    locationCity: string | null;
}

export class ClientDecisionsResponseDto {
    @ApiProperty()
    pending: number;

    @ApiProperty()
    'request-offer': number;

    @ApiProperty()
    pass: number;

    @ApiProperty()
    hold: number;

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    totalPages: number;

    @ApiProperty({ type: [ClientDecisionItem] })
    data: ClientDecisionItem[];
}
