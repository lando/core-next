# LIB KNOWLEDGE BASE

**Location:** `lib/`  
**Count:** 25 core class files

## OVERVIEW

Core classes providing Lando's runtime abstractions. Stateful, instantiated during bootstrap.

## KEY CLASSES

| Class | File | Role |
|-------|------|------|
| `Lando` | lando.ts | Orchestrator, bootstrap, plugin registry |
| `App` | app.ts | Project context, services, events |
| `Factory` | factory.ts | Builder registry, inheritance resolution |
| `Engine` | engine.ts | Docker daemon wrapper (dockerode) |
| `AsyncEvents` | events.ts | Priority-based event emitter |
| `Plugins` | plugins.ts | Plugin discovery/loading |
| `Cache` | cache.ts | File-based caching |
| `Shell` | shell.ts | Command execution |
| `Cli` | cli.ts | CLI framework (yargs-based) |

## PATTERNS

- **Class Export**: `export default class ClassName {}` (ESM)
- **Constructor Injection**: Classes receive `options` object, often containing `lando` instance
- **Event-Driven**: Heavy use of `AsyncEvents` for lifecycle hooks

```typescript
// Typical class structure (ESM)
export default class Engine {
  constructor(daemon, compose, docker, options = {}) {
    this.daemon = daemon;
    // ...
  }
  
  async someMethod() {
    return this.daemon.foo();
  }
}
```

## DEPENDENCIES

```
Lando
├── Factory (builder registry)
├── Plugins (plugin management)
├── Cache (file cache)
├── AsyncEvents
└── instantiates App per project
    ├── Engine (docker control)
    │   ├── Daemon
    │   ├── Compose  
    │   └── Docker
    └── AsyncEvents (app-level)
```

## GOTCHAS

- **Lando vs App Events**: Lando-level events fire once globally; App-level events fire per project
- **Bootstrap Levels**: Cannot access `engine` before level 3, `app` before level 4
- **Factory Mixins**: Builder inheritance uses functional mixins, not class extends
- **Circular Deps**: Some files have careful require ordering to avoid cycles
