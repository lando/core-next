---
title: Core Services
description: The core services configuration for Lando 4 core
---

# Services

Lando 4 `services` describe the infrastructure required to develop your project.

In abstract terms you can think of them as the containers needed to run, test, develop and build your project.

In concrete terms that _could_ mean something like `nginx:1.16` serving a `php:8.2` application with the `gd` php extension and a custom `php.ini` connecting to `mariadb:11` with a custom `stuff` database as in the case of a _very_ basic Drupal site.

Or it _could_ mean a `node:16` runtime to work on a simple node module.

Or it _could_ mean serving up an enterprise grade microservices application stack.

## Configuration

Services will generally take the below form:

**_Landofile_**

```yaml
services:
  my-service:
    type: "my-type"
    api: 4
    primary: false
    ...
```

#### name

`my-service` is the `name` of the service and you can generally name the service whatever you want. We like short and kabob-cased names though.

#### api

`api` is the Service API version. If ommitted it will default to the app `runtime`.

However we **highly recommend** you **do not** omit it! :)

#### type

`type` is the kind of service. By default Lando 4 has two types: `l337` and `lando`.

However, you can install plugins to get more `types` such as `php:8.2` or `postgres:12`.

#### primary

`primary` is generally ommitted which sets it to `false`. If you set it to `true` it will flag that service as the `primary` service.

This is purely a meta setting, meaning it "does nothing" by itself, however it is often used as the "default service" in other plugins.

If you set _multiple_ `primary` services to `true` Lando will use the first one.

#### ...

`...` denotes additional configuration options that can vary based on the `type` of service you are using and other plugins you may have installed.

For these options you will want to consult the documentation for the specific service `type` or `plugin`.

## Available Services

As noted above, most Lando services are provided by plugins that implement a specific service `type` with its own set of configuration options.

For example the `@lando/php` plugin implements a `php` service that looks something like this:

**_Landofile_**

```yaml
services:
  runtime:
    type: 'php:8.2'
    api: 4
    extensions:
      - 'curl'
      - 'gd'
      - 'imap'
      - 'json'
      - 'xdebug'
    config:
      memory_limit: '512M'
```

Generally, users will want to use officially supported or third party plugins. You can find a good list of officially supported and maintained services and their docs [over here](/). **@TODO: <- that page**

However, if those do not satisfy your use case Lando 4 provides two lower level core services:

- [L-337 Service](../services/l337.html)
- [Lando Service](../services/lando.html) **@TODO: <- that page**
