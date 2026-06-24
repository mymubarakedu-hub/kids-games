import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { GameConfigDto } from '../../../common/dto/game-config.dto';

/**
 * Validated body for the Number game configuration endpoint. Extends the
 * shared timing config with the inclusive number range.
 */
export class NumberConfigDto extends GameConfigDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  minNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  maxNumber?: number;
}
