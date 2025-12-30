# PACKAGES - Sub-Plugins

Internal mini-plugins that extend core Lando functionality. Each package is a self-contained plugin with its own hooks.

## STRUCTURE

```
packages/
  {name}/
    hooks/      # Event listeners
    plugin.yml  # Plugin manifest (optional)
```

## PACKAGES

| Package | Purpose | Key Hooks |
|---------|---------|-----------|
| **certs** | SSL certificate generation/management | CA setup, cert provisioning |
| **git** | Git integration | SSH key forwarding, git config |
| **proxy** | Traefik reverse proxy | Route registration, SSL termination |
| **security** | Security scanning | Vulnerability checks |
| **ssh-agent** | SSH agent forwarding | Key passthrough to containers |
| **sudo** | Privilege escalation | Host sudo operations |
| **user** | User/group mapping | UID/GID sync between host/container |

## CONVENTIONS

- Each package follows same structure as main plugin
- Hooks auto-discovered from `hooks/` directory
- Packages loaded during Lando bootstrap
- Can depend on core Lando functionality

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Modify proxy behavior | `proxy/` | Traefik config, routing |
| SSL certificate issues | `certs/` | CA trust, cert generation |
| SSH key problems | `ssh-agent/`, `git/` | Agent forwarding |
| Permission issues | `user/`, `sudo/` | UID/GID mapping |
