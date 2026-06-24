import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { SessionConfigDto } from '../common/dto';
import { ConfigurationService } from '../configurations/configuration.service';
import { SessionService } from '../sessions/session.service';
import { GameRegistryService } from './registry';

/**
 * Single, game-agnostic REST surface for the whole platform. Every route is
 * keyed by `:gameId` and delegates to the registry (catalogue), session
 * service (lifecycle/timers) and configuration service (saved settings).
 * Adding a game requires no changes here.
 */
@Controller('games')
export class GamesController {
  constructor(
    private readonly registry: GameRegistryService,
    private readonly sessions: SessionService,
    private readonly configs: ConfigurationService,
  ) {}

  /** GET /games — catalogue of available games. */
  @Get()
  listGames() {
    return this.registry.list();
  }

  /** POST /games/:gameId/start — create a session and begin the loop. */
  @Post(':gameId/start')
  @HttpCode(HttpStatus.OK)
  start(@Param('gameId') gameId: string, @Body() body: SessionConfigDto) {
    const saved = this.configs.get(gameId);
    const config = this.registry.resolveConfig(gameId, { ...saved, ...body });
    const { session, state } = this.sessions.start(gameId, config);
    return { sessionId: session.id, gameId, config, state };
  }

  @Post(':gameId/pause')
  @HttpCode(HttpStatus.OK)
  pause(@Param('gameId') gameId: string) {
    return this.sessions.pause(gameId);
  }

  @Post(':gameId/resume')
  @HttpCode(HttpStatus.OK)
  resume(@Param('gameId') gameId: string) {
    return this.sessions.resume(gameId);
  }

  @Post(':gameId/stop')
  @HttpCode(HttpStatus.OK)
  stop(@Param('gameId') gameId: string) {
    return this.sessions.stop(gameId);
  }

  @Post(':gameId/restart')
  @HttpCode(HttpStatus.OK)
  restart(@Param('gameId') gameId: string) {
    const { session, state } = this.sessions.restart(gameId);
    return { sessionId: session.id, gameId, state };
  }

  /** GET /games/:gameId/current-item — the item on screen + live timer. */
  @Get(':gameId/current-item')
  currentItem(@Param('gameId') gameId: string) {
    return this.sessions.getState(gameId);
  }

  /** GET /games/:gameId/reveal-answer — force-reveal the current answer. */
  @Get(':gameId/reveal-answer')
  reveal(@Param('gameId') gameId: string) {
    this.sessions.revealAnswer(gameId);
    return this.sessions.getState(gameId);
  }

  /** GET /games/:gameId/session — progress/tracking summary. */
  @Get(':gameId/session')
  session(@Param('gameId') gameId: string) {
    return this.sessions.summary(gameId);
  }

  /** POST /games/:gameId/configuration — save parent/admin settings. */
  @Post(':gameId/configuration')
  @HttpCode(HttpStatus.OK)
  saveConfig(@Param('gameId') gameId: string, @Body() body: SessionConfigDto) {
    // Ensure the game exists before persisting config for it.
    this.registry.getFactory(gameId);
    const saved = this.configs.save(gameId, body);
    return { gameId, config: this.registry.resolveConfig(gameId, saved) };
  }
}
