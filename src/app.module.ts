import { join } from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigurationsModule } from './configurations/configurations.module';
import { GamesModule } from './games/games.module';
import { SessionsModule } from './sessions/sessions.module';

/**
 * Root module. Composition only — feature logic lives in the feature modules.
 *
 *   ServeStatic        → kid-friendly web UI in /public
 *   Configurations     → saved parent/admin settings   (global)
 *   Sessions           → live game sessions + timers    (global)
 *   Games              → registry, engine, REST API, games
 */
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
      exclude: ['/games*'],
    }),
    ConfigurationsModule,
    SessionsModule,
    GamesModule,
  ],
})
export class AppModule {}
