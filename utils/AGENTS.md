# UTILITIES KNOWLEDGE BASE

**Location:** `utils/`
**Count:** 158 stateless helper functions

## OVERVIEW

Pure, stateless functions decoupled from `App` and `Engine` state. Utility-first approach minimizes code duplication across hooks, tasks, and builders.

## NAMING CONVENTIONS

- **Pattern:** `[verb]-[noun].js` (e.g., `get-host-path.js`)
- **Format:** kebab-case
- **Style:** Single-purpose, descriptive names

## CATEGORIES

| Prefix | Purpose | Examples |
|--------|---------|----------|
| `build-` | Construct commands, runners, objects | `build-docker-exec`, `build-tooling-runner` |
| `get-` | Retrieve env data, paths, defaults | `get-config-defaults`, `get-host-path` |
| `is-` | Boolean validation, state checks | `is-disabled`, `is-object` |
| `to-` | Type/format transformations | `to-object`, `checks-to-tasks` |
| `parse-` | Extract structured data | `parse-tooling-config`, `parse-events-config` |
| `run-` | Execute hooks, commands | `run-hooks`, `run-command` |
| `docker-` | Docker-specific logic | `docker-composify` |
| `generate-` | Artifact/script generation | `generate-dockerfiles`, `generate-build-script` |

## USAGE PATTERN

```javascript
// Direct import, single function per file
const buildDockerExec = require('../utils/build-docker-exec');
const cmd = buildDockerExec(service, options);
```

## ADDING NEW UTILS

1. **Name:** `verb-noun.js` pattern required
2. **Purity:** Stateless - never `require` App, Engine, or other stateful classes
3. **Dependencies:** Use `lodash`, `bluebird` for complex operations
4. **Input:** Prefer plain objects over class instances
5. **Output:** Return new objects; never mutate inputs
6. **Docs:** JSDoc required for main export
