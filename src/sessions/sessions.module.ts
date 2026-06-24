import { Global, Module } from '@nestjs/common';
import { SessionService } from './session.service';

/**
 * Session management. Global so the games controller (and any future game
 * module) can drive sessions without re-importing.
 */
@Global()
@Module({
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionsModule {}
