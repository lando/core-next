

import {describe, expect, test, beforeEach, afterEach, jest} from 'bun:test';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import Landerode from './../lib/docker';
const landerode = new Landerode();
import Dockerode from 'dockerode';
import _ from 'lodash';
import Promise from './../lib/promise';

let tempDir;

const dummyContainer = (overrides = {}) => {
  return _.assign(
    new Dockerode.Container(),
    {
      Id: '8675309',
      app: 'Death Star',
      Labels: {
        'com.docker.compose.project': 'Death Star',
        'com.docker.compose.service': 'Exhaust Port',
        'com.docker.compose.container-number': 73,
        'com.docker.compose.oneoff': 'no',
        'io.lando.container': 'TRUE',
        'io.lando.src': '/tmp/.lando.yml',
        'io.lando.id': 'lando',
        'io.lando.service-container': 'no',
      },
    },
    overrides,
  );
};

describe('docker', () => {
  describe('#Landerode', () => {
    test('should inherit things from Dockerode', () => {
      expect(Landerode.prototype).toBeInstanceOf(Dockerode);
    });
  });

  describe('#createNetwork', () => {
    test('should merge name correctly into opts', async () => {
      const stub = jest.spyOn(landerode, 'createNetwork').mockResolvedValue();
      await landerode.createNet('elthree', {});
      expect(stub).toHaveBeenCalled();
      const callArgs = stub.mock.calls[0][0];
      expect(callArgs.Name).toBe('elthree');
      expect(callArgs.Internal).toBe(true);
      stub.mockRestore();
    });

    test('should throw an error if can\'t create network', async () => {
      const stub = jest.spyOn(landerode, 'createNetwork').mockRejectedValue(new Error('Too Many Capes'));

      await expect(landerode.createNet('hardtimes')).rejects.toThrow('Too Many Capes');
      stub.mockRestore();
    });
  });

  describe('#inspect', () => {
    test('should throw an error if inspect fails', () => {
      const bogusContainer = dummyContainer();
      const inspectStub = jest.spyOn(bogusContainer, 'inspect').mockImplementation(() => {
        throw new Error('inspect failed');
      });
      const stub = jest.spyOn(landerode, 'getContainer').mockReturnValue(bogusContainer);

      const cptPhasma = () => landerode.inspect('fn-2187');

      expect(cptPhasma).toThrow();

      inspectStub.mockRestore();
      stub.mockRestore();
    });
  });

  describe('#isRunning', () => {
    test('should return false if State.Running inspect data is false', async () => {
      const bogusContainer = dummyContainer();
      const inspectStub = jest.spyOn(bogusContainer, 'inspect').mockResolvedValue({
        State: {
          Running: false,
        },
      });
      const getStub = jest.spyOn(landerode, 'getContainer').mockReturnValue(bogusContainer);

      const result = await landerode.isRunning('YT-1300');
      expect(result).toBe(false);

      inspectStub.mockRestore();
      getStub.mockRestore();
    });

    test('should return true if State.Running inspect data is true', async () => {
      const bogusContainer = new Dockerode.Container({}, 'YT-1300');
      const inspectStub = jest.spyOn(bogusContainer, 'inspect').mockResolvedValue({
        State: {
          Running: true,
        },
      });
      const getStub = jest.spyOn(landerode, 'getContainer').mockReturnValue(bogusContainer);

      const result = await landerode.isRunning('YT-1300');
      expect(result).toBe(true);

      inspectStub.mockRestore();
      getStub.mockRestore();
    });

    test('should return false if container doesn\'t exist', async () => {
      const bogusContainer = new Dockerode.Container();
      const inspectStub = jest.spyOn(bogusContainer, 'inspect')
        .mockRejectedValue(new Error('No such container: foo'));
      const getStub = jest.spyOn(landerode, 'getContainer')
        .mockReturnValue(bogusContainer);

      const result = await landerode.isRunning('foo');
      expect(result).toBe(false);

      getStub.mockRestore();
      inspectStub.mockRestore();
    });

    test('should throw an error on all other catches', async () => {
      const bogusContainer = new Dockerode.Container();
      const inspectStub = jest.spyOn(bogusContainer, 'inspect').mockRejectedValue(new Error('It\'s a trap!'));
      const getStub = jest.spyOn(landerode, 'getContainer').mockReturnValue(bogusContainer);

      let thrownError;
      try {
        await landerode.isRunning('foo');
      } catch (err) {
        thrownError = err;
      }
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toContain('It\'s a trap!');

      getStub.mockRestore();
      inspectStub.mockRestore();
    });
  });

  describe('#list', () => {
    require('../utils/to-lando-container');
    require('../utils/docker-composify');

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-test-'));
      fs.writeFileSync(path.join(tempDir, '.lando.yml'), 'CODEZ');
    });

    test('should filter out any containers that are pending removal', async () => {
      const listStub = jest.spyOn(landerode, 'listContainers')
        .mockImplementation(() => Promise.resolve([
          dummyContainer({Status: 'Being Awesome', Labels: {...dummyContainer().Labels, 'io.lando.src': path.join(tempDir, '.lando.yml')}}),
          dummyContainer({
            Status: 'Removal In Progress',
            Labels: {...dummyContainer().Labels, 'io.lando.src': path.join(tempDir, '.lando.yml')},
          }),
        ]));
      const result = await landerode.list();
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      listStub.mockRestore();
    });

    test('should remove any "null" containers', async () => {
      const listStub = jest.spyOn(landerode, 'listContainers')
        .mockImplementation(() => Promise.resolve([
          null,
          dummyContainer({identity: 'Solo', Labels: {...dummyContainer().Labels, 'io.lando.src': path.join(tempDir, '.lando.yml')}}),
        ]));

      const result = await landerode.list();
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      listStub.mockRestore();
    });

    test('should filter out non-lando containers', async () => {
      const listStub = jest.spyOn(landerode, 'listContainers')
        .mockImplementation(() => Promise.resolve([
          dummyContainer({Labels: {'io.lando.container': 'FALSE'}}),
          dummyContainer({Labels: {...dummyContainer().Labels, 'io.lando.src': path.join(tempDir, '.lando.yml')}}),
        ]));

      const result = await landerode.list();
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      listStub.mockRestore();
    });

    test('should filter by app name if given', async () => {
      const listStub = jest.spyOn(landerode, 'listContainers')
        .mockImplementation(() => Promise.resolve([
          dummyContainer({Labels: {
            'com.docker.compose.project': 'alderaan',
            'com.docker.compose.service': 'Rescue Mission',
            'com.docker.compose.container-number': 73,
            'com.docker.compose.oneoff': 'no',
            'io.lando.container': 'TRUE',
            'io.lando.id': 'lando',
            'io.lando.service-container': 'no',
            'io.lando.src': path.join(tempDir, '.lando.yml'),
          }}),
          dummyContainer({Labels: {...dummyContainer().Labels, 'io.lando.src': path.join(tempDir, '.lando.yml')}}),
        ]));

      const result = await landerode.list({app: 'alderaan'});
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      listStub.mockRestore();
    });

    test('should throw an error on all other catches', async () => {
      const container = dummyContainer();
      delete container.lando;
      const listStub = jest.spyOn(landerode, 'listContainers')
        .mockImplementation(() => Promise.resolve([container]));

      let thrownError;
      try {
        await landerode.list();
      } catch (err) {
        thrownError = err;
      }
      expect(thrownError).toBeDefined();
      listStub.mockRestore();
    });

    afterEach(() => {
      if (tempDir) {
        fs.rmSync(tempDir, {recursive: true, force: true});
      }
    });
  });

  describe('#remove', () => {
    test('should throw an error if remove fails', async () => {
      const container = dummyContainer({Id: '1234'});

      const getStub = jest.spyOn(landerode, 'getContainer').mockReturnValue(container);
      const removeStub = jest.spyOn(container, 'remove')
        .mockRejectedValue(new Error('Oh No!'));

      await expect(landerode.remove('1234')).rejects.toThrow('Oh No!');

      getStub.mockRestore();
      removeStub.mockRestore();
    });
  });
});
