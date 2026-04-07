import { ApiProperty } from '@nestjs/swagger';
import { User as UserEntity } from '../../database/entities/user.entity';

export class CandidateUserWrapper {
    @ApiProperty({ type: () => UserEntity })
    user: UserEntity;
}

export class ClientApplication {
    @ApiProperty()
    id: string;

    @ApiProperty({ type: () => CandidateUserWrapper })
    candidate: CandidateUserWrapper;

    @ApiProperty()
    jobTitle: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ required: false })
    locationCountry: string | null;

    @ApiProperty({ required: false })
    locationState: string | null;

    @ApiProperty({ required: false })
    locationCity: string | null;
}
