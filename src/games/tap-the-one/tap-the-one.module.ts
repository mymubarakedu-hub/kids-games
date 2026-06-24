import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import {
  BaseGameConfig,
  DEFAULT_BASE_CONFIG,
  GameFactory,
  GameMetadata,
  LearningGame,
} from '../interfaces';
import { ClientGame } from '../game-engine';
import { GameRegistryService } from '../registry';

/**
 * Tap-the-Right-One: show a target and a few choices; the child taps the match.
 * Plays in the browser with live scoring (accuracy / response time), so it uses
 * a ClientGame stub rather than the countdown engine.
 */
@Injectable()
class TapTheOneFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'tap-the-one',
    name: 'Tap the Right One',
    description: 'Tap the picture that matches the word you hear.',
    route: '/games/tap-the-one',
  };
  defaultConfig(): BaseGameConfig {
    return { ...DEFAULT_BASE_CONFIG };
  }
  create(): LearningGame {
    return new ClientGame(this.metadata.id, this.metadata.name);
  }
}

@Module({ providers: [TapTheOneFactory] })
export class TapTheOneModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: TapTheOneFactory,
  ) {}
  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
