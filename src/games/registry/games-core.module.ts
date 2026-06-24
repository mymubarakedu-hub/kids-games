import { Global, Module } from '@nestjs/common';
import { GameRegistryService } from './game-registry.service';

/**
 * Shared core for the games subsystem. Holds the single registry instance that
 * all game modules register into. Marked @Global so any game module can inject
 * the registry without re-importing this module.
 */
@Global()
@Module({
  providers: [GameRegistryService],
  exports: [GameRegistryService],
})
export class GamesCoreModule {}
