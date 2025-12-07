# Plugins Example

This example exists primarily to test the following documentation:

* [Plugins](https://docs.lando.dev/core/v3/plugins.html)

See the [Landofiles](https://docs.lando.dev/config/lando.html) in this directory for the exact magicks.

## Start up tests

```bash
# Should start successfully
lando poweroff
lando start
```

## Verification commands

Run the following commands to verify things work as expected

```bash
# Should load plugins from pluginDirs
lando stuff | grep "I WORKED"

# Should load plugins specified in landofile
lando stuff2 | grep "I WORKED"

# Should be able to add a public plugin via a registry string.
lando config | grep -qv "plugins/@lando/php"
lando plugin-add "@lando/php"
lando config | grep -q "plugins/@lando/php"
lando plugin-remove "@lando/php"
lando config | grep -qv "plugins/@lando/php"

# Should be able to add a plugin from local directory.
wget https://github.com/lando/php/archive/refs/heads/main.tar.gz && tar -xf main.tar.gz
lando plugin-add "./php-main"
lando config | grep -q "plugins/@lando/php"
lando plugin-remove "@lando/php"
lando config | grep -qv "plugins/@lando/php"

# Should be able to add a plugin from a remote tarball.
lando config | grep -qv "plugins/@lando/php"
lando plugin-add "https://github.com/lando/php/archive/refs/heads/main.tar.gz"
lando config | grep -q "plugins/@lando/php"
lando plugin-remove "@lando/php"
lando config | grep -qv "plugins/@lando/php"

# Should be able to add a plugin from a git string `lando/plugin#branch`
lando plugin-add "lando/php#main"
lando config | grep -q "plugins/@lando/php"
lando plugin-remove "@lando/php"
lando config | grep -qv "plugins/@lando/php"

# Should be able to add a plugin from a git repo URL.
lando plugin-add "https://github.com/lando/php.git"
lando config | grep -q "plugins/@lando/php"
lando plugin-remove "@lando/php"
lando config | grep -qv "plugins/@lando/php"
```

# Destroy tests

```bash
# Should destroy successfully
lando destroy -y
lando poweroff
```
