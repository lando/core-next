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

***Landofile***
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

***Landofile***
```yaml
services:
  runtime:
    type: "php:8.2"
    api: 4
    extensions:
      - "curl"
      - "gd"
      - "imap"
      - "json"
      - "xdebug"
    config:
      memory_limit: "512M"
```
Generally, users will want to use officially supported or third party plugins. You can find a good list of officially supported and maintained services and their docs [over here](./../services.md).

However, if those do not satisfy your use case Lando 4 provides two lower level core services:

* [Lando Service](#lando-service)
* [L-337 Service](#l-337-service)

## Lando Service

The `lando` service allows you to easily _Landoify_ some preexisting image so you can make it useful for development. It is the lowest level `typed` service and _generally_ is what all other services are built on top of. You can read more [here](#lando-service)


TBD

* note comparison to lando 3 compose service

## L-337 Service

The `l337` service is the lowest level `api: 4` service and it implements **L**ando Specification **337**. You can use it directly in your Landofile by setting `api: 4` in any service and omitting its `type` key.

::: warning You're low, go high
This is the lowest-level abstraction in Lando; we do not recommend using it directly. If you are looking to build your own service or just need a generic service type you'll want to start with the [Lando Service](#lando-service).
:::

In high level terms it combines service orchestration and image specification into a single format.

Specifically, it is a light superset around the [Docker Compose Version 3](https://docs.docker.com/compose/compose-file/compose-file-v3/) format that also uses the [Dockerfile](https://docs.docker.com/engine/reference/builder/) specification.

This means that you _should_ be able to paste Docker Compose content into your Landofile, add `api: 4` to each service and have it "just work".

::: tip WORKS WITH MORE THAN JUST DOCKER!
The adoption of the Docker Compose and Dockerfile formats is purely for specification/meta purposes and does not mean Lando 4 can _only_ be used with Docker.

That said Docker and Docker Compose are the default Lando 4 build engine and orchestrator, respectively.
:::

As noted above **L**ando Specification **337** extends the Docker Compose 3 spec with Dockerfile stuff. That means that everything in both of those specs is supported by default. So this is a valid Landofile:

***Landofile***
```yaml
name: "my-app"
services:
  # this is a Lando 3 php service
  php:
    type: "php:7.4"
    api: 3

  # these are Lando 4 "l337" services
  web:
    api: 4
    image: "nginx:1.15"
    networks:
      my-network:
    volumes:
      - "./:/app"
      - "my-data:/data"
  db:
    api: 4
    build:
      dockerfile: "./Dockerfile"
networks:
  my-network:
volumes:
  my-data:
```

OK cool, got it, but how does Dockerfile stuff factor in?
<br>What is actually different in the spec besides `api`?

Two questions. One Answer: `image`

... and that's it.

### Image

Lando Specification 337 is identical to the Docker Compose spec with the exception of the `image` key which now handles different string inputs and has an extended object format for **MOAR POWAH**.

The string input for `image` has been extended and now allows the below:

**Landofile**
```yaml
name: "my-app"
services:
  # a valid registry image, eg the original Docker Compose usage
  example-1:
    api: 4
    image: "nginx:1.21"

  # a path to a Dockerfile compatible file
  example-2:
    api: 4
    image: "./images/nginx/Dockerfile"

  # raw Dockerfile compatible instructions
  example-3:
    api: 4
    image: |
      FROM nginx:1.21
      ENV HELLO there
      ...
      CMD run-stuff

```

You can extend `image` into object format to get access to more features. Here is an example that implements all the keys available in object format.

**Landofile**
```yaml
name: "my-app"
services:
  example-1:
    api: 4
    image:
      imagefile: "nginx:1.21"
      tag: "pirog/nginx:1.21"
      context:
        - "./nginx.conf:/etc/nginx/conf.d/default.conf"
      groups:
        - reallllllearly: -8675309
      steps:
        - instructions: "RUN id > /tmp/user"
          group: "reallllllearly"
        - instructions: |
            ENV VIBES rising
            RUN echo "hello" id > /var/ww/index.html
          group: "reallllllearly-10-before-root"
```

#### Imagefile

The `image` string notation format above actually populates the `imagefile` key behind the scenes. For that reason, this usage is the same as above but with a different key.

**Landofile**
```yaml
name: "my-app"
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
        CMD run-stuff
```

Note that you can also use `dockerfile` instead of `imagefile` if you prefer that usage. If you use both `imagefile` will win.

#### Tag

If you wish to force Lando to use a particular tag on successful image creation, you can.

**Landofile**
```yaml
name: "my-app"
services:
  tag-me-bro:
    api: 4
    image:
      imagefile: |
        FROM nginx:1.21
        ENV SERVER=apache
        ENV CONFUSED=true
      tag: "loki/apache:1.21"
```

#### Context

If you would like to `COPY` and/or `ADD` files into your build context and image then use `context`. Many forms and options are supported:

**Landofile**
```yaml
name: "my-app"
services:
  example-1:
    api: 4
    image:
      imagefile: "nginx:1.21"
      context:
        # COPY ./folder to /folder
        - "./folder"

        # COPY ./folder to /thing
        - "./folder:thing"

        # COPY file1 to /file2
        - "file1:/file2"

        # COPY file1 to /file3
        - src: "file1"
          dest: "file3"

        # COPY file1 to /file4
        - source: "file1"
          destination: "file4"

        # COPY ./images/Dockerfile to /images/Dockerfile
        - source: "./images/Dockerfile"

        # COPY file1 to /file6 and set ownership to nginx:nginx
        - source: "file1"
          destination: "file6"
          owner: "nginx:nginx"

        # COPY file1 to /file7 and set ownership to nginx:nginx
        - source: "file1"
          destination: "file7"
          user: "nginx"
          group: "nginx"

        # ADD HeresAHealthToTheCompany.json
        # to /SeaShanties/lyrics/main/shanties/HeresAHealthToTheCompany.json
        - source: "https://raw.githubusercontent.com/SeaShanties/lyrics/main/shanties/HeresAHealthToTheCompany.json"

        # ADD available-shanties.json
        # to /etc/config/available-shanties.json and set ownership to blackbeard
        - source: "https://raw.githubusercontent.com/SeaShanties/lyrics/main/available-shanties.json"
          dest: "/etc/config/available-shanties.json"
          owner: "eddie-teach"
```

#### Groups

`groups` allow you to organize [`steps`](#steps).

By default every `l337` service has two groups, `default` and `context`, with the following values:

```yaml
context:
  description: "A group for adding and copying sources to the image"
  weight: 0
  user: "root"
default:
  description: "A default general purpose build group around which other groups can be added"
  weight: 1000
  user: "root"
```

You can add additional groups into your Landofile and then use them in your `steps`.

**Landofile**
```yaml
name: "my-app"
services:
  example-1:
    api: 4
    image:
      imagefile: "nginx:1.21"
      groups:
        # adds a group called "val-jean" with weight "24601"
        # uses root user by default
        - val-jean: 24601

        # adds a root user group called "system" that runs first
        - name: "system"
          description: "Install system packages and stuff"
          weight: -10000
          user: "root"

        # adds a nginx user group called "user" that runs last
        - name: "user"
          description: "Allows for user run commands after other groups"
          weight: 10000
          user: "nginx"

```

#### Steps

While you _can_ specify an entire Imagefile's contents directly in `image.imagefile` it's often better to use `steps` which are ordered and partial Dockerfile-compatible instructions.

Because `steps` are wrapped in a standardized and ordered layer, Lando and any of its plugins can insert `instructions` into the resulting `imagefile` wherever they make the most sense. This allows for great flexibility.

However, we are mostly interested here in how `steps` can be used directly in a Landofile.

**Landofile**
```yaml
name: "my-app"
services:
  example-1:
    api: 4
    image:
      imagefile: "nginx:1.21"
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
              KIRK: "wesley"
              SPOCK: "peck"
          - run: "env"
          - run:
            - "stat"
            - "/tmp"

        # insert group detached, one-off, singleton, instructions
        # at arbitrary weight
        - instructions: "ENV PIKE mount"
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
          group: "system"
        - instructions: "RUN id > /tmp/user"
          group: "user"

        # insert instructions using group-override format
        # runs -4 weight units before the system group
        - instructions: |
            ENV KIRK shatner
            ENV SPOCK nimoy
          group: "system-4-before"
        # run 10 weight units after the user group but uses the root user
        - instructions: |
            ENV KIRK shatner
            ENV SPOCK nimoy
          group: "user-10-root"
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

### Caveats

As you may have already suspected because the `l337` service sits _below_ the main [`lando`](#lando-service) service it lacks **_ALL_** Lando features. Using it is pretty equivalent to just using Docker Compose/Dockerfile straight up.

Said another way, you should really only use this service directly if you are _intentionally_ looking to avoid normal Lando features or want to use something that is more-or-less like Docker Compose.

That said, this service does still offer a few quality of life improvements.

#### Auto app mount discovery

If you `volume` mount your app root directory then Lando will assume its mount destination as the app mount for tooling purposes. Consider the following example:

**Landofile**
```yaml
name: "my-app"
services:
  my-service:
    api: 4
    image: "php:8.2-cli"
    volumes:
      - "./:/home"
tooling:
  pwd:
    service: "my-service"
```

Note that changing the directory on the host also changes the location at which `lando pwd` is executed within the container:

```bash
lando pwd
# /home
cd subdir && lando pwd
# /home/subdir
```

#### Working dir support

If you do not mount your app root directory as above then Lando will use `working_dir` to set the default tooling `dir` for that service.

**Landofile**
```yaml
name: "my-app"
services:
  my-service:
    api: 4
    image: "php:8.2-cli"
    working_dir: "/var/www"
tooling:
  pwd:
    service: "my-service"
```

 Note that `lando pwd` still executes in the `working_dir` location, even though we change directories on the host machine:

```bash
lando pwd
# /var/www
cd subdir && lando pwd
# /var/www
```

### Examples

If you would like to look at concrete and tested examples you can check out the below:

* [Lando 3 implementation of L-337](https://github.com/lando/core/tree/main/examples/l337)
