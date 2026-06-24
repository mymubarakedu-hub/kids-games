import { Module, OnModuleInit } from '@nestjs/common';
import { GameRegistryService } from '../registry';
import { VehicleRecognitionFactory } from './services/vehicle-recognition.factory';

@Module({
  providers: [VehicleRecognitionFactory],
})
export class VehicleRecognitionModule implements OnModuleInit {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly factory: VehicleRecognitionFactory,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.factory);
  }
}
