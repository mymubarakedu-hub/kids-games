import { Module, OnModuleInit } from '@nestjs/common';
import { GameRegistryService } from '../registry';
import { ShapeRecognitionFactory } from './services/shape-recognition.factory';

@Module({
  providers: [ShapeRecognitionFactory],
})
export class ShapeRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: ShapeRecognitionFactory,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
