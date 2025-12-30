# HOOKS KNOWLEDGE BASE

**Location:** `hooks/`  
**Count:** 76 async event listeners

## OVERVIEW

Lifecycle hooks for App and Lando events. Each file = one hook function registered on specific event.

## NAMING CONVENTION

```
[context]-[action]-[subject].ts
    │        │         └── what's being modified
    │        └── verb: add, run, set, build, check, setup, load, purge
    └── "app" or "lando"
```

## HOOK CATEGORIES

| Prefix | Event Context | Purpose | Examples |
|--------|---------------|---------|----------|
| `app-add-*` | App init | Inject features | tooling, proxy, certs, healthchecks |
| `app-run-*` | App lifecycle | Execute operations | build, v4-build-steps |
| `app-set-*` | App config | Configure options | tooling-compose-opts |
| `app-check-*` | Pre-start | Validation | docker-compat |
| `app-purge-*` | Destroy | Cleanup | compose, tooling |
| `lando-setup-*` | `lando setup` | System setup | ca, docker-engine, orchestrator |
| `lando-get-*` | Bootstrap | Retrieve data | app |
| `lando-load-*` | Bootstrap | Load config | keys, certs, compose-cache |

## EXECUTION ORDER

Hooks can specify priority (lower = earlier):

```typescript
const hook = async (app, lando) => { /* ... */ };
hook.priority = 100;  // Optional, default varies by event
export default hook;
```

Common priorities:
- `1-99`: Early setup, must run first
- `100-500`: Normal operations
- `500+`: Late cleanup, finalization

## ADDING NEW HOOKS

1. **Create file**: `hooks/[context]-[action]-[subject].ts`
2. **Export async function**:
```typescript
const hook = async (app, lando) => {
  // For app hooks: receives (app, lando)
  // For lando hooks: receives (lando)
  
  app.events.on('post-start', async () => {
    // Hook into specific lifecycle event
  });
};

// Optional priority
hook.priority = 100;
export default hook;
```

3. **Register in plugin**: Add to `app.ts` or `index.ts` hooks array

## KEY HOOKS

| Hook | Purpose |
|------|---------|
| `app-add-v4-services` | Register v4 service builders |
| `app-add-tooling` | Inject CLI tooling commands |
| `app-add-proxy-info` | Configure Traefik proxy routes |
| `app-run-v4-build-steps` | Execute Dockerfile builds |
| `lando-setup-orchestrator` | Install docker-compose |
