'use strict';

// Modules
const _ = require('lodash');
const Dockerode = require('dockerode');
const fs = require('fs');
const Promise = require('./promise');

/*
 * Helper for direct container opts
 */
const containerOpt = (container, method, message, opts = {}) => container[method](opts).catch(err => {
  throw new Error(err, message, container);
});

/*
 * Helper to determine files exists in an array of files
 */
const srcExists = (files = []) => _.reduce(files, (exists, file) => fs.existsSync(file) || exists, false);

/*
 * Creates a new yaml instance.
 */
module.exports = class Landerode extends Dockerode {
  id: string;

  constructor(opts: any = {}, id = 'lando', promise = Promise) {
    opts.Promise = promise;
    super(opts);
    this.id = id;
  }

  /*
   * Creates a network
   */
  createNet(name, opts = {}) {
    return this.createNetwork(_.merge({}, opts, {Name: name, Attachable: true, Internal: true}))
    // Wrap errors.
    .catch(err => {
      throw new Error(err, 'Error creating network.');
    });
  }

  /*
   * Inspects a container.
   */
  scan(cid) {
    return containerOpt(this.getContainer(cid), 'inspect', 'Error inspecting container: %j');
  }

  /*
   * Return true if the container is running otherwise false.
   */
  isRunning(cid) {
    return this.scan(cid)
    // Get the running state
    .then(data => _.get(data, 'State.Running', false))
    // If the container no longer exists, return false since it isn't running.
    // This will prevent a race condition from happening.
    // Wrap errors.
    .catch(err => {
      // This was true for docker composer 1.26.x and below
      if (_.includes(err.message, `No such container: ${cid}`)) return false;
      // This is what it looks like for 1.27 and above
      else if (_.includes(err.message, `no such container -`)) return false;
      // Otherwise throw
      else throw err;
    });
  }

  /*
   * Returns a list of Lando containers
   */
  list(options = {}, separator = '_') {
    const toLandoContainer = require('../utils/to-lando-container');
    const dockerComposify = require('../utils/docker-composify');

    return this.listContainers(options)
    .then(containers => {
      return containers
        .filter(_.identity)
        .filter(data => data.Status !== 'Removal In Progress')
        .map(container => toLandoContainer(container, separator))
        .filter(data => data.lando === true)
        .filter(data => data.instance === this.id);
    })
    .then(containers => {
      const keepPromises = containers.map(container => {
        if (!srcExists(container.src) && container.kind === 'app') {
          return this.remove(container.id, {force: true}).then(() => false);
        }
        return Promise.resolve(true);
      });
      return Promise.all(keepPromises).then(keeps => containers.filter((_, i) => keeps[i]));
    })
    .then(containers => {
      if (options.project) return _.filter(containers, c => c.app === options.project);
      if (options.app) return _.filter(containers, c => c.app === dockerComposify(options.app));
      return containers;
    })
    .then(containers => {
      if (!_.isEmpty(options.filter)) {
        return _.filter(containers, _.fromPairs(_.map(options.filter, filter => filter.split('='))));
      }
      return containers;
    })
    .then(containers => {
      if (_.find(containers, container => container.status === 'Up Less than a second')) {
        return this.list(options, separator);
      }
      return containers;
    })
    .then(containers => containers.map(container => {
      container.running = container && typeof container.status === 'string' && !container.status.includes('Exited');
      return container;
    }));
  }

  /*
   * Remove a container.
   * @todo: do we even use this anymore?
   */
  remove(cid, opts = {v: true, force: false}) {
    return containerOpt(this.getContainer(cid), 'remove', 'Error removing container: %j', opts);
  }

  /*
   * Do a docker stop
   */
  stop(cid, opts = {}) {
    return containerOpt(this.getContainer(cid), 'stop', 'Error stopping container: %j', opts);
  }
};
