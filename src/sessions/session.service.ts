import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { BaseGameConfig, GameState } from '../games/interfaces';
import { GameRegistryService } from '../games/registry';
import { GameSession, SessionSummary } from './session.entity';

/**
 * Manages the lifecycle of game sessions.
 *
 * Single-player model: one active session per game id (which is what the
 * `/games/:gameId/*` control routes assume). Sessions are also indexed by id
 * so future multi-profile / multi-device play can address them directly.
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly activeByGame = new Map<string, GameSession>();
  private readonly byId = new Map<string, GameSession>();

  constructor(private readonly registry: GameRegistryService) {}

  /** Create a fresh session and begin the question loop. */
  start(gameId: string, config: BaseGameConfig): { session: GameSession; state: GameState } {
    this.disposeActive(gameId);

    const game = this.registry.createInstance(gameId, config);
    const session = new GameSession(uuid(), gameId, game, config, this.now());
    this.activeByGame.set(gameId, session);
    this.byId.set(session.id, session);

    const state = game.start();
    this.logger.log(`Started session ${session.id} for ${gameId}`);
    return { session, state };
  }

  pause(gameId: string): GameState {
    return this.requireActive(gameId).game.pause();
  }

  resume(gameId: string): GameState {
    return this.requireActive(gameId).game.resume();
  }

  stop(gameId: string): GameState {
    return this.requireActive(gameId).game.stop();
  }

  /** Stop the current play-through and start a new one with the same config. */
  restart(gameId: string): { session: GameSession; state: GameState } {
    const config = this.requireActive(gameId).config;
    return this.start(gameId, config);
  }

  getState(gameId: string): GameState {
    return this.requireActive(gameId).game.getState();
  }

  getCurrentItem(gameId: string) {
    return this.requireActive(gameId).game.getCurrentItem();
  }

  revealAnswer(gameId: string) {
    return this.requireActive(gameId).game.revealAnswer();
  }

  summary(gameId: string): SessionSummary {
    const session = this.requireActive(gameId);
    const state = session.game.getState();
    return {
      sessionId: session.id,
      gameId: session.gameId,
      phase: state.phase,
      questionNumber: state.questionNumber,
      totalQuestions: state.totalQuestions,
      completedQuestions: state.completedQuestions,
      timeSpentSeconds: session.elapsedSeconds(this.now()),
    };
  }

  requireActive(gameId: string): GameSession {
    const session = this.activeByGame.get(gameId);
    if (!session) {
      throw new NotFoundException(`No active session for game "${gameId}". Start one first.`);
    }
    return session;
  }

  private disposeActive(gameId: string): void {
    const existing = this.activeByGame.get(gameId);
    if (existing) {
      existing.game.dispose();
      this.byId.delete(existing.id);
      this.activeByGame.delete(gameId);
    }
  }

  private now(): number {
    return Date.now();
  }
}
