import { Module, OnModuleInit } from '@nestjs/common';
import { GameRegistryService } from '../registry';
import { AlphabetRecognitionFactory } from './services/alphabet-recognition.factory';

/**
 * Alphabet Recognition game module.
 *
 * Self-contained: it provides its factory and registers it with the global
 * GameRegistry on startup. Adding a new game means cloning this module — no
 * edits to the core, controller, or session layer.
 */
@Module({
  providers: [AlphabetRecognitionFactory],
})
export class AlphabetRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: AlphabetRecognitionFactory,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
