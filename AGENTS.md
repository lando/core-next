# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-30
**Commit:** 996b015
**Branch:** main

## OVERVIEW

Lando core - Docker-based local development environment orchestrator. Node.js 20+, event-driven plugin architecture, manages Docker Compose services with automatic proxying, SSL certs, and tooling injection.

## STRUCTURE

```
lando--core-next/
├── bin/lando           # CLI entry (preflight, task cache, bootstrap)
├── lib/                # Core classes (Lando, App, Factory, Engine, etc)
├── builders/           # Service type definitions (_prefix=internal)
├── hooks/              # Async event listeners (76 files, lifecycle)
├── utils/              # Helper functions (158 files, stateless)
├── tasks/              # CLI commands (destroy, exec, info, rebuild...)
├── scripts/            # Shell helpers (certs, docker, entrypoints)
├── components/         # Docker engine, plugin, error, yaml loaders
├── messages/           # User-facing error/warning messages
├── renderers/          # Output formatters (dc2, debug, lando)
├── sources/            # Init source handlers (cwd, github, remote)
├── inits/              # Project initializers
├── packages/           # Sub-plugins (certs, git, proxy, ssh-agent, sudo)
├── examples/           # Integration test fixtures
├── experimental/       # Unstable features
└── docs/               # VitePress documentation
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add CLI command | `tasks/` | Export async function, gets (app, lando) |
| Add service type | `builders/` | Extend _service.js or _service-v4.js |
| Hook into lifecycle | `hooks/` | Name: `[context]-[action]-[subject].js` |
| Add utility function | `utils/` | Pure functions, no state |
| Modify Docker behavior | `lib/engine.js`, `lib/compose.js` | dockerode wrapper |
| Change proxy config | `packages/proxy/` | Traefik-based |
| Add setup step | `hooks/lando-setup-*.js` | Runs on `lando setup` |
| Debug bootstrap | `lib/lando.js` | 4 levels: config→tasks→engine→app |

## ARCHITECTURE

### Bootstrap Levels
```
config → tasks → engine → app
   │        │        │       └── Services, tooling, proxy
   │        │        └── Docker daemon, compose
   │        └── CLI commands registered
   └── Plugins loaded, merged config
```

### Key Abstractions

| Class | Role | File |
|-------|------|------|
| `Lando` | Orchestrator, bootstrap, plugin registry | `lib/lando.js` |
| `App` | Project context, services, events | `lib/app.js` |
| `Factory` | Builder registry, inheritance resolution | `lib/factory.js` |
| `Engine` | Docker daemon wrapper | `lib/engine.js` |
| `AsyncEvents` | Priority-based event emitter | `lib/events.js` |

### Plugin Discovery
- Built-in: `./` (this repo is a plugin)
- External: `@lando/*` packages, `plugins/` directory
- Each plugin exports `plugin.yml` + entry files

### Service Versions
- **v3**: Legacy, uses `_service.js` builder
- **v4**: Modern, uses `_service-v4.js`, Dockerfile-based (l337 spec)

## CONVENTIONS

### Code Style
- ESLint: Google style, 140 char max
- Empty catch blocks allowed (`allowEmptyCatch: true`)
- JSDoc required for function declarations only

### Naming
- Hooks: `[context]-[action]-[subject].js` (e.g., `app-add-tooling.js`)
- Builders: `_prefix` = internal/base class
- Utils: kebab-case, verb-noun (e.g., `build-docker-exec.js`)

### Module Pattern
```javascript
// Hooks, tasks, builders
module.exports = async (app, lando) => { ... };

// Utils - pure functions
module.exports = (input) => output;
```

### Heavy Dependencies
- `lodash`: Use throughout (`_.get`, `_.merge`, `_.map`)
- `bluebird`: Promise utilities (avoid native where bluebird used)
- `dockerode`: Docker API (wrapped by Engine)

## ANTI-PATTERNS (THIS PROJECT)

| Pattern | Why Bad | Alternative |
|---------|---------|-------------|
| Direct `docker` CLI calls | Bypasses Engine abstraction | Use `lando.engine.*` |
| Sync file operations | Blocks event loop | Use async `fs/promises` |
| Mutating shared state | Race conditions | Return new objects |
| `as any` / `@ts-ignore` | This is JS, but don't start | Type with JSDoc |
| Running as root | Security risk | Warn and exit |

### Known Technical Debt
- "Orchestrator reset" hack for v3/v4 compat in `app.js`
- "Mega loop" for bind address detection
- Many `TODO` comments for v4 migration
- `ignoreReturnCode` usage in setup (fragile)

## COMMANDS

```bash
# Development
npm run lint              # ESLint check
npm run test:unit         # Mocha unit tests
npm run test:leia         # Integration tests (requires Docker)

# Using Lando
./bin/lando <command>     # Run local dev version
lando start               # Start app services
lando rebuild             # Rebuild containers
lando destroy             # Remove app completely
```

## TESTING

- **Unit**: `test/*.spec.js` (Mocha + Chai)
- **Integration**: `examples/*/README.md` files contain bash code blocks parsed by Leia framework
  - Each example dir (e.g., `exec`, `proxy`, `tooling`) has a README.md with test commands
  - Code blocks under "Start up tests", "Verification commands", "Destroy tests" headers
  - `.github/workflows/pr-core-tests.yml` runs each example via matrix (`leia-test: [badname, build, cache, ...]`)
  - To add integration test: create `examples/{name}/` with `.lando.yml` + `README.md` with bash blocks, add to workflow matrix

## NOTES

- **Task Cache**: CLI caches task list for fast startup. Full bootstrap only when needed.
- **IPv4 First**: DNS resolution forced to IPv4 first (`--dns-result-order=ipv4first`)
- **Runtime Selection**: Supports v3/v4 runtime selection at CLI level
- **Docker Version Constraints**: compose 1.x/2.x, desktop >=4.0.0<5, engine >=18<28
- **Domain**: Default `.lndo.site`, configurable via `caDomain`
