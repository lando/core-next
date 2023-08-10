---
title: Core Services
description: The core services configuration for Lando 4 core
---

# Services

Lando 4 `services` describe the infrastructure required to develop your site or application.

In abstract terms you can think of them as the development versions of the images and containers needed to run your app in production.

In concrete terms that _could_ mean something like `nginx:1.16` serving a `php:8.2` application with a few extensions and a custom `php.ini` connecting to `mariadb:11` with a custom `stuff` database as in the case of a _very_ basic Drupal site.

A service will generally take the below form:

***Landofile***
```yaml
services:
  my-service:
    api: 4
    type: my-type
    ...
```

* `my-service` is the name of the service.
* `api` is the service api version. If ommitted it will default to the `runtime`.
* `type` is the kind of service. It can be something like `php:8.2` or `postgres:12`.
* `...` just means any additional configuration options depending on the `type`.

::: tip EXPLICITLY SET API
We highly recommend you explicitly set the service `api` version for each service and not let the `runtime` determine the `api`. This will be especially true until Lando 4 reaches feature parity with Lando 3.
:::

By default core provides two types of services: `lando` and `_compose`.

The `lando` service allows you to easily _Landoify_ some preexisting image eg make it useful for development. It _generally_ is what all other services are built on top of. You can read more [here](#lando-service)

The `_compose` service is what is used if `type` is ommitted. It is the lowest level Lando service and it implements our **L**ando Docker Compose **3** **E**ngineering **T**erminology or **L337**. Generally, users and Lando developers will not need to tread into such deep waters but it exists and we've [documented](#l337-service) it. :)

Other service types such as `php`, `mariadb` and `node` extend Lando core with plugins and you should consult those docs for relevant config, usage, etc.

## Lando Service

TBD

* note comparison to lando 3 compose service

## L337 Service

The **L**ando Docker Compose **3** **E**ngineering **T**erminology or **L337** spec is our lowest level service configuration format meaning [at the end of the day](https://www.youtube.com/watch?v=i-DZa5cuFyk) all higher level services end up expressed in this format.

You can use it directly in your Landofile by setting `api: 4` in any service and omitting its `type` key.

In high level terms it combines service orchestration and image specification into a single format. Specifically it is a light super set around the [Docker Compose Version 3](https://docs.docker.com/compose/compose-file/compose-file-v3/) format that also uses the [Dockerfile](https://docs.docker.com/engine/reference/builder/) specification.

This means that you _should_ be able to paste Docker Compose content into your Landofile, add `api: 4` to each service and have it "just work".

::: tip WORKS WITH MORE THAN JUST DOCKER!
The adoption of the Docker Compose and Dockerfile formats is purely for specification purposes and does not mean Lando 4 can _only_ be used with Docker.

That said Docker and Docker Compose are the default Lando 4 build engine and orchestrator, respectively.
:::

As noted above L337 extends the Docker Compose 3 spec with Dockerfile stuff. That means that everything in both of those specs is supported by default. So this is a valid Landofile:

***Landofile***
```yaml
name: my-app
services:
  # this is a Lando 3 php service
  php:
    api: 3
    type: php:7.4

  # these are Lando 4 "lando compose" services
  web:
    api: 4
    image: nginx:1.15
    networks:
      my-network:
    volumes:
      - ./:/app
      - my-data:/data
  db:
    api: 4
    build:
      dockerfile: ./Dockerfile
networks:
  my-network:
volumes:
  my-data:
```

OK cool, got it, but how does Dockerfile stuff factor in?
<br>What is actually different in the spec besides `api`?

Good questions. Answer: `image`.

### Image

The `image` key is the biggest change and main event of the L337 spec. However, the original DC3 usage of both the `image` and `build` keys are still both supported.

In short form eg string notation `image` looks like this:

**Landofile**
```yaml
name: my-app
services:

  # a valid registry image
  example-1:
    api: 4
    image: nginx:1.21

  # a path to a Dockerfile compatible file
  example-2:
    api: 4
    image: ./images/nginx/Dockerfile

  # raw Dockerfile compatible instructions
  example-3:
    api: 4
    image: |
      FROM nginx:1.21
      ENV HELLO there
      ...
      COMMAND run-stuff

```

::: tip INTERCHANGEBLE KEYS
Note that you can use `build` interchangebly with `image` and `build|image.dockerfile` interchangebly with `build|image.imagefile`.
:::

You can expand `image` into object notation to get access to the _**REAL POWER**_: `imagefile`, `context`, `groups` and `steps`.

#### Imagefile

The `image` string notation format above actually populates the `imagefile` key behind the scenes. For that reason the usage is  the same as above but with a different key.

**Landofile**
```yaml
name: my-app
services:

  # a valid registry image
  example-1:
    api: 4
    image:
      imagefile: nginx:1.21

  # a path to a Dockerfile compatible file
  example-2:
    api: 4
    image:
      imagefile: ./images/nginx/Dockerfile

  # raw Dockerfile compatible instructions
  example-3:
    api: 4
    image:
      imagefile: |
        FROM nginx:1.21
        ENV HELLO there
        ...
        COMMAND run-stuff
```

Note that you can also use `dockerfile` instead of `imagefile` if you prefer that usage. If you use both `imagefile` will win.

#### Context

If you would like to `COPY` and/or `ADD` files into your build context and image then use `context`. Many forms and options are supported:

**Landofile**
```yaml
name: my-app
services:
  example-1:
    api: 4
    image:
      imagefile: nginx:1.21
      context:
        # COPY ./folder to /folder
        - ./folder

        # COPY ./folder to /thing
        - ./folder:thing

        # COPY file1 to /file2
        - file1:/file2

        # COPY file1 to /file3
        - src: file1
          dest: file3

        # COPY file1 to /file4
        - source: file1
          destination: file4

        # COPY ./images/Dockerfile to /images/Dockerfile
        - source: ./images/Dockerfile

        # COPY file1 to /file6 and set ownership to nginx:nginx
        - source: file1
          destination: file6
          owner: nginx:nginx

        # COPY file1 to /file7 and set ownership to nginx:nginx
        - source: file1
          destination: file7
          user: nginx
          group: nginx

        # ADD HeresAHealthToTheCompany.json
        # to /SeaShanties/lyrics/main/shanties/HeresAHealthToTheCompany.json
        - source: https://raw.githubusercontent.com/SeaShanties/lyrics/main/shanties/HeresAHealthToTheCompany.json

        # ADD available-shanties.json
        # to /etc/config/available-shanties.json and set ownership to blackbeard
        - source: https://raw.githubusercontent.com/SeaShanties/lyrics/main/available-shanties.json
          dest: /etc/config/available-shanties.json
          owner: eddie-teach
```

#### Groups

`groups` allow you to organize [`steps`](#steps).

By default every L337 service has two groups `default` and `context` with the following values:

```yaml
context:
  description: A group for adding and copying sources to the image
  weight: 0
  user: root
default:
  description: A default general purpose build group around which other groups can be added
  weight: 1000
  user: root
```

You can add additional groups into your Landofile and then use them in your `steps`.

**Landofile**
```yaml
name: my-app
services:
  example-1:
    api: 4
    image:
      imagefile: nginx:1.21
      groups:
        # adds a group called "val-jean" with weight "24601"
        # uses root user by default
        - val-jean: 24601

        # adds a root user group called "system" that runs first
        - name: system
          description: Install system packages and stuff
          weight: -10000
          user: root

        # adds a nginx user group called "user" that runs last
        - name: user
          description: Allows for user run commands after other groups
          weight: 10000
          user: nginx

```

#### Steps

While you _can_ specify an entire Imagefile's contents directly in `image.imagefile` it's often better to use `steps` which are ordered and partial Dockerfile-compatible instructions.

Because `steps` are wrapped in a standardized and ordered layer Lando and any of its plugins can insert `instructions` into the resulting `imagefile` whereever they make the most sense. This allows for great flexibility.

However, we are mostly interested here in how `steps` can be used directly in a Landofile.

**Landofile**
```yaml
name: my-app
services:
  example-1:
    api: 4
    image:
      imagefile: nginx:1.21
      groups:
        ... # as defined [above](#groups) and omitted here for brevity
      steps:
        # insert string instructions into the default group
        - instructions: |
            ENV VIBES RISING
            RUN apt-get update -y
            RUN /my-script.sh

        # insert array format instructions into the default group
        # See: https://www.npmjs.com/package/dockerfile-generator for syntax
        - instructions:
          - env:
              KIRK: wesley
              SPOCK: peck
          - run: env
          - run:
            - 'stat'
            - '/tmp'

        # insert group detached, one-off, singleton, instructions
        # at arbitrary weight
        - instructions: ENV PIKE mount
          weight: 1001
        - instructions: |
            RUN echo "last" >> /stuff
          weight: 999
        - instructions: |
            RUN echo "first" >> /stuff
          weight: 1

        # insert instructions into groups
        - instructions: |
            ENV KIRK pine
            ENV SPOCK quinto
            RUN id > /system-user
          group: system
        - instructions: RUN id > /tmp/user
          group: user

        # insert instructions using group-override format
        # runs -4 weight units before the system group
        - instructions: |
            ENV KIRK shatner
            ENV SPOCK nimoy
          group: system-4-before
        # run 10 weight units after the user group but uses the root user
        - instructions: |
            ENV KIRK shatner
            ENV SPOCK nimoy
          group: user-10-root
```

Note that the group override syntax is flexible as long as the parent group is first. For example the following overrides are equivalent:

```bash
system-2
system-2-after
system-root-after-2
system-2-after-root
system-root-2-after
```

That said, we like the `GROUP-OFFSET-DIRECTION-USER` format. ;)

Also note that it is totally possible to have defined two `groups` like `system` and `system-4`. In this scenario a `step` using the `system-4` group will actually use the `system-4` group and not override the `system` group with a `4-after` offset.

Since this can easily get confusing it's best to be careful when defining your group names.

### Lando stuff?

By design most of the typical _Lando-y_ features originate in the [`lando`](#lando-service) service and thus are available in that service and the services that build on it. Since the `lando` service is built on top of this one those features are not available here.

Said another way, you should really only use this service directly if you are _intentionally_ looking to avoid normal Lando features or want to use something that is more-or-less like Docker Compose.

That said we still are capable of providing a few quality of life hookups in this service.

#### Auto app mount discovery

#### Working dir support

### Examples

If you would like to look at concrete and tested examples you can check out the below:

* [Lando 3 Service API 4 Examples](https://github.com/lando/core/tree/main/examples/L337)
