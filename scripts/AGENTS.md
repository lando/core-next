# SCRIPTS - Shell Helpers

Shell scripts for container entrypoints, system setup, and utilities. Mix of Bash (.sh) and PowerShell (.ps1).

## CATEGORIES

| Category | Files | Purpose |
|----------|-------|---------|
| **Entrypoint** | `entrypoint.sh`, `boot.sh` | Container startup, env sourcing |
| **Docker** | `docker-engine-*.sh`, `docker-desktop-*.ps1` | Daemon management |
| **Certs** | `add-cert.sh`, `generate-key.sh`, `install-ca-*.sh` | SSL certificate handling |
| **User/Perms** | `add-to-group.sh`, `user-perms.sh` | User setup, permissions |
| **SQL** | `load-keys.sh`, `sql-*.sh` | Database utilities |
| **Network** | `setup-*.sh` | Host file, resolver config |

## CONVENTIONS

### Bash Scripts
```bash
#!/bin/bash
set -eo pipefail        # Fail fast
source /etc/lando/environment  # Load Lando env vars
debug() { ... }         # Use debug() for verbose output
exec "$@"               # Pass through to final command
```

### Environment
- Scripts source `/etc/lando/environment` for Lando-specific vars
- `LANDO_DEBUG` enables verbose output via `debug()` function
- Scripts run inside containers, not on host

### PowerShell Scripts
- Windows-specific Docker Desktop management
- Used for start/stop operations on Windows hosts

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Modify container boot | `entrypoint.sh`, `boot.sh` | Entry point chain |
| Add CA certificate | `add-cert.sh`, `install-ca-*.sh` | Per-distro implementations |
| Docker daemon control | `docker-engine-*.sh` | Linux engine management |
| Windows Docker | `docker-desktop-*.ps1` | PowerShell for Windows |
| User permissions | `user-perms.sh`, `add-to-group.sh` | Container user setup |

## ANTI-PATTERNS

- **No hardcoded paths**: Use env vars from `/etc/lando/environment`
- **No interactive prompts**: Scripts run non-interactively in containers
- **No host assumptions**: Scripts execute inside containers
