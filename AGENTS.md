# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-30
**Commit:** 46d8ec9
**Branch:** refactor/phase-6-bun-compile

## OVERVIEW

Lando core - Docker-based local development environment orchestrator. Bun runtime, TypeScript, ESM modules, event-driven plugin architecture. Manages Docker Compose services with automatic proxying, SSL certs, and tooling injection.

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
| Add CLI command | `tasks/` | Export default async function |
| Add service type | `builders/` | Extend _service.ts or _service-v4.ts |
| Hook into lifecycle | `hooks/` | Name: `[context]-[action]-[subject].ts` |
| Add utility function | `utils/` | Pure functions, no state |
| Modify Docker behavior | `lib/engine.ts`, `lib/compose.ts` | dockerode wrapper |
| Change proxy config | `packages/proxy/` | Traefik-based |
| Add setup step | `hooks/lando-setup-*.ts` | Runs on `lando setup` |
| Debug bootstrap | `lib/lando.ts` | 4 levels: config→tasks→engine→app |

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
| `Lando` | Orchestrator, bootstrap, plugin registry | `lib/lando.ts` |
| `App` | Project context, services, events | `lib/app.ts` |
| `Factory` | Builder registry, inheritance resolution | `lib/factory.ts` |
| `Engine` | Docker daemon wrapper | `lib/engine.ts` |
| `AsyncEvents` | Priority-based event emitter | `lib/events.ts` |

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
- Hooks: `[context]-[action]-[subject].ts` (e.g., `app-add-tooling.ts`)
- Builders: `_prefix` = internal/base class
- Utils: kebab-case, verb-noun (e.g., `build-docker-exec.ts`)

### Module Pattern (ESM)
```typescript
// Hooks, tasks, builders - default export
export default async (app, lando) => { ... };

// Utils - named or default exports
export default (input) => output;
export const helper = () => { ... };
```

### Heavy Dependencies
- `lodash`: Use throughout (`_.get`, `_.merge`, `_.map`)
- `dockerode`: Docker API (wrapped by Engine)

## ANTI-PATTERNS (THIS PROJECT)

| Pattern | Why Bad | Alternative |
|---------|---------|-------------|
| Direct `docker` CLI calls | Bypasses Engine abstraction | Use `lando.engine.*` |
| Sync file operations | Blocks event loop | Use async `fs/promises` |
| Mutating shared state | Race conditions | Return new objects |
| `as any` / `@ts-ignore` | Undermines type safety | Use proper types |
| Running as root | Security risk | Warn and exit |

### Known Technical Debt
- "Orchestrator reset" hack for v3/v4 compat in `app.ts`
- "Mega loop" for bind address detection
- Many `TODO` comments for v4 migration
- `ignoreReturnCode` usage in setup (fragile)
- Legacy CommonJS patterns being migrated to ESM

## COMMANDS

```bash
# Development (all via Bun)
bun run lint              # ESLint check
bun test                  # Unit tests (Bun test runner)
bun run test:leia         # Integration tests (Leia, requires Docker)

# Build
bun run build             # Compile to standalone binaries

# Using Lando
./bin/lando <command>     # Run local dev version
lando start               # Start app services
lando rebuild             # Rebuild containers
lando destroy             # Remove app completely
```

## TESTING

- **Unit**: `test/*.spec.ts` (Bun test runner)
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

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
