import { Module, OnModuleInit } from '@nestjs/common';
import { GameRegistryService } from '../registry';
import { AnimalRecognitionFactory } from './services/animal-recognition.factory';

@Module({
  providers: [AnimalRecognitionFactory],
})
export class AnimalRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: AnimalRecognitionFactory,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
