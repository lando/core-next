# TASKS - CLI Commands

CLI command definitions for `lando <command>`. Each file exports a task factory.

## PATTERN

```typescript
export default (lando, config?) => ({
  command: 'name',
  describe: 'Help text',
  usage: '$0 name [options]',
  level: 'engine' | 'app',  // Bootstrap depth required
  options: { /* yargs options */ },
  positionals: { /* yargs positionals */ },
  run: async (options) => { /* implementation */ }
});
```

## BOOTSTRAP LEVELS

| Level | What's Available | Use For |
|-------|------------------|---------|
| `engine` | `lando.engine`, `lando.cli`, Docker daemon | Global commands (list, poweroff, setup, version) |
| `app` | Above + `lando.getApp()`, services, tooling | App-specific commands (start, stop, rebuild, exec) |

## COMMAND CATEGORIES

| Category | Commands | Notes |
|----------|----------|-------|
| App lifecycle | start, stop, restart, rebuild, destroy | Require `level: 'app'` |
| Info | info, config, list, logs, version | `list` is engine-level |
| Exec | exec, ssh | Run commands in containers |
| Setup | setup, update | System configuration |
| Plugins | plugin-add, plugin-login, plugin-logout, plugin-remove | Plugin management |
| Init | init | Project scaffolding |
| Advanced | poweroff, share, shellenv | Power user features |

## CONVENTIONS

- **App access**: `const app = await lando.getApp(options.app)` then `await app.init()`
- **Output**: Use `lando.cli.makeArt()` for formatted output
- **Errors**: Throw or return error object with `{ code, message }`
- **Options**: Define with yargs syntax, access via `options.optionName`

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add new CLI command | Create `{name}.ts` | Export task factory function |
| Modify exec behavior | `exec.ts` | Complex service/user resolution |
| Change start/stop flow | `start.ts`, `stop.ts` | Simple app lifecycle wrappers |
| Plugin management | `plugin-*.ts` | Auth, add, remove flows |
