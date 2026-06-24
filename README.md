# 🎈 Kids Learning Platform

A scalable children's learning web app built with **NestJS**. The platform is a
host for many educational mini-games that share one reusable game engine. Each
game is an **independent tool** (its own module, factory, route and home-screen
tile); they share only the engine and theme.

Thirteen games ship today, in three styles:

**Countdown games** (the shared timer engine: show → countdown → reveal):
- **Alphabet Recognition** — uppercase / lowercase / mixed letters.
- **Number Recognition** — a configurable range; start at **0–10** and raise the
  top number in the grown-up settings as the child grows.
- **Counting** — count the objects; configurable "count up to".
- **Color / Shape / Vehicle / Animal / Fruit / Weather / Emotion / Body Part
  Recognition** — name the thing on screen.

**Dataset games** (Colors → Body Parts above) share a tiny
`DatasetRecognitionGame` + `ShuffleBag` (balanced, no-repeat picking) on the
backend and one reusable `GameUI` renderer on the frontend, so each is only a
data file plus a thin factory/module — yet still fully independent.

**Browser-driven games** (no countdown engine; register via a `ClientGame`
stub so they still appear in the catalogue):
- **Memory Match** — flip-and-pair grid; difficulty = number of pairs.
- **Tap the Right One** — hear a word, tap the matching picture; tracks
  **accuracy and response time** (the basis for a future parent dashboard).

Designed for children **aged 2–8**: large display, bright colors, big
touch-friendly buttons, smooth animations, spoken pronunciation, and a fully
responsive layout (phone / tablet / desktop, with a reduced-motion option).

---

## Quick start

```bash
npm install
npm run build
npm start            # or: npm run start:dev  (watch mode)
```

Then open **http://localhost:3000** and pick **Alphabet Recognition**.

Change the port with `PORT=4000 npm start`. Run the tests with `npm test`.

> The frontend is a zero-build static app served by Nest from `/public`. It
> talks to the same REST API documented below, so the whole platform runs from
> a single process.

---

## How a round works

```
QUESTION ──(questionDuration)──▶ REVEAL ──(answerRevealDuration)──▶ next QUESTION
                                                       └────────────▶ COMPLETED
```

1. A random letter is shown and a countdown ring starts.
2. The child tries to name it (and is encouraged to say it aloud).
3. When the timer hits zero the answer + pronunciation are revealed (and spoken).
4. The answer stays up for the configured reveal duration.
5. The next random letter appears. Repeat until the session completes.

Letters are drawn from a **shuffled bag** (draw-without-replacement) so the
distribution is balanced across a session, and the same letter never appears
twice in a row.

---

## Architecture

```
src/
├── app.module.ts                 # root composition: static UI + feature modules
├── main.ts                       # bootstrap, global validation, CORS
│
├── common/
│   └── dto/                      # shared, validated request DTOs
│
├── configurations/               # saved parent/admin settings  (global module)
│
├── sessions/                     # live sessions, timers, progress  (global module)
│
└── games/
    ├── interfaces/               # LearningGame, GameItem, GameFactory, GamePhase…
    ├── game-engine/              # BaseLearningGame — the reusable engine
    ├── registry/                 # GameRegistryService (catalogue + self-registration)
    ├── games.controller.ts       # the ONE game-agnostic REST surface
    ├── games.module.ts           # imports every game module
    │
    └── alphabet-recognition/     # ← a self-contained game module
        ├── dto/
        ├── services/
        │   ├── alphabet-recognition.game.ts     # extends BaseLearningGame
        │   └── alphabet-recognition.factory.ts  # describes + mints instances
        ├── letter-bag.ts
        ├── alphabet.types.ts
        └── alphabet-recognition.module.ts        # self-registers with the registry
```

### Design principles

- **Reusable engine** — `BaseLearningGame` owns the full lifecycle (start/pause/
  resume/stop/reset), timer handling, reveal handling, session/progress
  tracking, and the state-machine. A game only implements `generateItem()`.
- **Registry + self-registration** — each game module registers its
  `GameFactory` with `GameRegistryService` on startup. The controller, sessions
  and frontend never hard-code a game list.
- **One generic API** — every route is keyed by `:gameId` and delegates to the
  registry/session/configuration services. New games need **zero** controller
  changes.
- **SOLID / Clean Architecture / DI** — interfaces define contracts; concrete
  games depend only on `BaseLearningGame` + the `GameItem` shape; state stores
  are swappable (in-memory today, a database tomorrow) behind their services.

---

## REST API

| Method & path | Purpose |
|---|---|
| `GET    /games` | List available games (catalogue) |
| `POST   /games/:gameId/start` | Create a session and start the loop |
| `POST   /games/:gameId/pause` | Pause (freezes the timer) |
| `POST   /games/:gameId/resume` | Resume from pause |
| `POST   /games/:gameId/stop` | Stop the session |
| `POST   /games/:gameId/restart` | Restart with the same config |
| `GET    /games/:gameId/current-item` | Current item + live timer/phase |
| `GET    /games/:gameId/reveal-answer` | Force-reveal the current answer |
| `GET    /games/:gameId/session` | Progress/tracking summary |
| `POST   /games/:gameId/configuration` | Save parent/admin settings |

### Configuration body

```json
{
  "questionDuration": 4,
  "answerRevealDuration": 2,
  "totalQuestions": 20,
  "letterMode": "mixed"
}
```

`letterMode` ∈ `uppercase` · `lowercase` · `mixed`. All fields are validated
(`class-validator`) and optional — omitted fields fall back to the game's
defaults. Saved config is merged onto defaults; a `start` body can override per
session.

### Example

```bash
curl -X POST localhost:3000/games/alphabet-recognition/start \
  -H 'Content-Type: application/json' \
  -d '{"questionDuration":4,"answerRevealDuration":2,"totalQuestions":10,"letterMode":"uppercase"}'
```

```jsonc
// current-item / start response state
{
  "phase": "question",          // idle | question | reveal | paused | completed | stopped
  "questionNumber": 1,
  "totalQuestions": 10,
  "completedQuestions": 0,
  "currentItem": { "id": "G", "display": "G", "answer": "G", "pronunciation": "Gee" },
  "revealedAnswer": null,        // populated during the reveal phase
  "remainingMs": 3850,           // time left in the current phase
  "phaseEndsAt": 1782283768793   // epoch ms — lets the UI render a smooth countdown
}
```

---

## Frontend

A framework-free static app in [`public/`](public/) that mirrors the backend
design:

- `core/api.js` — typed-ish client over the REST API.
- `core/router.js` — hash router (`#/games/:gameId`) **+ a `GameComponents`
  registry** that each game's JS self-registers into.
- `games/alphabet-recognition.game.js` — the Alphabet component (big letter,
  SVG countdown ring, controls, grown-up settings, spoken pronunciation via the
  browser `SpeechSynthesis` API — no audio files required).
- `app.js` — renders the catalogue from `GET /games` and dynamically mounts the
  component for the routed game.

Swapping in a richer SPA (Next.js, etc.) later is purely a frontend change — the
API contract stays the same. The `phaseEndsAt`/`remainingMs` fields are provided
specifically so any client can render a smooth countdown.

---

## Adding a new game (e.g. Number Recognition)

No core files change. Three steps:

**1. Create the game** — extend the engine and implement `generateItem()`:

```ts
// src/games/number-recognition/services/number-recognition.game.ts
import { BaseLearningGame } from '../../game-engine';
import { GameItem } from '../../interfaces';

export class NumberRecognitionGame extends BaseLearningGame {
  readonly id = 'number-recognition';
  readonly name = 'Number Recognition';

  protected generateItem(): GameItem {
    const n = Math.floor(Math.random() * 10);      // 0–9
    return { id: String(n), display: String(n), answer: String(n) };
  }
}
```

**2. Add a factory** (describes the game + mints instances):

```ts
// src/games/number-recognition/services/number-recognition.factory.ts
import { Injectable } from '@nestjs/common';
import { DEFAULT_BASE_CONFIG, GameFactory, GameMetadata } from '../../interfaces';
import { NumberRecognitionGame } from './number-recognition.game';

@Injectable()
export class NumberRecognitionFactory implements GameFactory {
  readonly metadata: GameMetadata = {
    id: 'number-recognition',
    name: 'Number Recognition',
    description: 'Identify numbers 0–9 before the timer reveals the answer.',
    route: '/games/number-recognition',
  };
  defaultConfig() { return { ...DEFAULT_BASE_CONFIG }; }
  create(config) { return new NumberRecognitionGame(config); }
}
```

**3. Add a self-registering module** and list it in `games.module.ts`:

```ts
// src/games/number-recognition/number-recognition.module.ts
@Module({ providers: [NumberRecognitionFactory] })
export class NumberRecognitionModule implements OnModuleInit {
  constructor(
    private registry: GameRegistryService,
    private factory: NumberRecognitionFactory,
  ) {}
  onModuleInit() { this.registry.register(this.factory); }
}
```

```ts
// src/games/games.module.ts  → add to imports
imports: [GamesCoreModule, AlphabetRecognitionModule, NumberRecognitionModule],
```

That's it on the backend — the game now appears in `GET /games`, all
`/games/number-recognition/*` routes work, and sessions/timers/config come for
free. For a custom UI, drop a `public/games/number-recognition.game.js` that
calls `window.GameComponents.register('number-recognition', …)`; otherwise the
catalogue shows a friendly "coming soon" until then.

---

## Tested behaviour

`npm test` covers the two things most worth pinning down:

- **Engine state machine** — question→reveal→advance→complete transitions,
  pause/resume time-freezing, and stop (with fake timers).
- **Letter selection** — balanced distribution and the no-immediate-repeat
  guarantee.

---

## Roadmap (wired for, not yet built)

Speech recognition to verify spoken answers · progress/parent dashboards · child
profiles · achievements · difficulty levels · multi-language · offline support.
The `GameItem.meta`, `audioUrl`, and `SessionSummary` fields exist as extension
points for these.
