import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesCoreModule } from './registry';
import { AlphabetRecognitionModule } from './alphabet-recognition/alphabet-recognition.module';
import { NumberRecognitionModule } from './number-recognition/number-recognition.module';
import { ColorRecognitionModule } from './color-recognition/color-recognition.module';
import { ShapeRecognitionModule } from './shape-recognition/shape-recognition.module';
import { VehicleRecognitionModule } from './vehicle-recognition/vehicle-recognition.module';
import { AnimalRecognitionModule } from './animal-recognition/animal-recognition.module';
import { FruitRecognitionModule } from './fruit-recognition/fruit-recognition.module';
import { WeatherRecognitionModule } from './weather-recognition/weather-recognition.module';
import { EmotionRecognitionModule } from './emotion-recognition/emotion-recognition.module';
import { BodypartRecognitionModule } from './bodypart-recognition/bodypart-recognition.module';
import { CountingModule } from './counting/counting.module';
import { MemoryMatchModule } from './memory-match/memory-match.module';
import { TapTheOneModule } from './tap-the-one/tap-the-one.module';

/**
 * Aggregates the games subsystem: the shared core (registry/engine), the
 * single REST controller, and every game module.
 *
 * To add a game: create its module (see AlphabetRecognitionModule) and add it
 * to the `imports` array below. Nothing else changes.
 */
@Module({
  imports: [
    GamesCoreModule,
    AlphabetRecognitionModule,
    NumberRecognitionModule,
    ColorRecognitionModule,
    ShapeRecognitionModule,
    VehicleRecognitionModule,
    AnimalRecognitionModule,
    FruitRecognitionModule,
    WeatherRecognitionModule,
    EmotionRecognitionModule,
    BodypartRecognitionModule,
    CountingModule,
    MemoryMatchModule,
    TapTheOneModule,
  ],
  controllers: [GamesController],
})
export class GamesModule {}
