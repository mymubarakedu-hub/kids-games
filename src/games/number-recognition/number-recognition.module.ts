import { Module, OnModuleInit } from '@nestjs/common';
import { GameRegistryService } from '../registry';
import { NumberRecognitionFactory } from './services/number-recognition.factory';

/**
 * Number Recognition game module. Self-contained: provides its factory and
 * registers it with the global GameRegistry on startup.
 */
@Module({
  providers: [NumberRecognitionFactory],
})
export class NumberRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: NumberRecognitionFactory,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
