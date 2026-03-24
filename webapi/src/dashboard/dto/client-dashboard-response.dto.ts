import { ApiProperty } from '@nestjs/swagger';
import { Application, ClientDecisionType } from '../../database/entities/application.entity';

export class DecisionCountDto {
    @ApiProperty({ enum: ['request-offer', 'pass', 'hold'], description: 'The type of decision' })
    decision: ClientDecisionType | null;

    @ApiProperty({ description: 'Number of candidates with this decision' })
    count: number;
}

export class JobOrderDashboardDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    status: string;

    @ApiProperty({ required: false })
    workArrangement: string | null;

    @ApiProperty({ required: false })
    locationCity: string | null;

    @ApiProperty({ required: false })
    locationCountry: string | null;

    @ApiProperty()
    candidateCount: number;
}

export class ClientDashboardResponseDto {
    @ApiProperty({ description: 'Number of active job orders' })
    activeOrders: number;

    @ApiProperty({ description: 'Total Candidates' })
    totalCandidates: number;

    @ApiProperty({ description: 'Number of candidates awaiting client decision' })
    pendingDecisions: number;

    @ApiProperty({ description: 'Offers in Progress' })
    offersInProgress: number;

    @ApiProperty({
        description: 'Latest job applications',
        type: [Application],
    })
    recentCandidates: Application[];

    @ApiProperty({
        description: 'Stats of client decisions',
        type: [DecisionCountDto],
    })
    myDecisions: DecisionCountDto[];

    @ApiProperty({
        description: 'Latest job orders for the client',
        type: [JobOrderDashboardDto],
    })
    myJobOrders: JobOrderDashboardDto[];
}
