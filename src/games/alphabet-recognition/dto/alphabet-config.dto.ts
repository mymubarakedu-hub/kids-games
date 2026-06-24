import { IsEnum, IsOptional } from 'class-validator';
import { LetterMode } from '../alphabet.types';
import { GameConfigDto } from '../../../common/dto/game-config.dto';

/**
 * Validated body for the Alphabet game configuration endpoint. Extends the
 * shared timing config with the alphabet-specific letter mode.
 */
export class AlphabetConfigDto extends GameConfigDto {
  @IsOptional()
  @IsEnum(LetterMode, {
    message: `letterMode must be one of: ${Object.values(LetterMode).join(', ')}`,
  })
  letterMode?: LetterMode;
}
