import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Shared, validated configuration body. All fields optional so callers can
 * patch a single setting; missing fields fall back to the game's defaults.
 */
export class GameConfigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  questionDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  answerRevealDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  totalQuestions?: number;

  @IsOptional()
  @IsBoolean()
  autoStart?: boolean;
}
