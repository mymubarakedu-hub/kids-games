import { Module, OnModuleInit } from '@nestjs/common';
import { GameRegistryService } from '../registry';
import { ColorRecognitionFactory } from './services/color-recognition.factory';

@Module({
  providers: [ColorRecognitionFactory],
})
export class ColorRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: ColorRecognitionFactory,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
