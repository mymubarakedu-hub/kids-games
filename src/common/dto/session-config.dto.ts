import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { GameConfigDto } from './game-config.dto';

/**
 * Body accepted by the generic start/configuration endpoints. Carries the
 * shared timing fields plus the per-game settings each game interprets
 * (alphabet's letter mode, numbers' range). Kept loose so `common` stays
 * independent of any specific game's enums; games may also ship a stricter
 * per-game DTO for their own endpoints.
 */
export class SessionConfigDto extends GameConfigDto {
  // Alphabet Recognition
  @IsOptional()
  @IsString()
  letterMode?: string;

  // Number Recognition
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

  // Counting
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  minCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxCount?: number;
}
