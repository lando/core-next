# LIB KNOWLEDGE BASE

**Location:** `lib/`  
**Count:** 25 core class files

## OVERVIEW

Core classes providing Lando's runtime abstractions. Stateful, instantiated during bootstrap.

## KEY CLASSES

| Class | File | Role |
|-------|------|------|
| `Lando` | lando.js | Orchestrator, bootstrap, plugin registry |
| `App` | app.js | Project context, services, events |
| `Factory` | factory.js | Builder registry, inheritance resolution |
| `Engine` | engine.js | Docker daemon wrapper (dockerode) |
| `AsyncEvents` | events.js | Priority-based event emitter |
| `Plugins` | plugins.js | Plugin discovery/loading |
| `Cache` | cache.js | File-based caching |
| `Shell` | shell.js | Command execution |
| `Cli` | cli.js | CLI framework (yargs-based) |

## PATTERNS

- **Class Export**: `module.exports = class ClassName {}`
- **Constructor Injection**: Classes receive `options` object, often containing `lando` instance
- **Event-Driven**: Heavy use of `AsyncEvents` for lifecycle hooks
- **Bluebird Promises**: Use bluebird, not native Promises

```javascript
// Typical class structure
module.exports = class Engine {
  constructor(daemon, compose, docker, options = {}) {
    this.daemon = daemon;
    // ...
  }
  
  async someMethod() {
    return this.daemon.foo();
  }
};
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
