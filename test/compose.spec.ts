

import {describe, expect, test} from 'bun:test';

import compose from './../lib/compose';

const myOpts = {
  'id': 'appname_service_1',
  'pull': true,
  'services': {
    'appserver': {},
  },
  'app': {
    'services': 'someappthathasnohopeofexisting',
  },
  'build': {},
  'cmd': [
    'drush',
    'b',
  ],
  'entrypoint': [],
  'pre': 'drush',
  'environment': 'dev',
  'rm': true,
  'noDeps': true,
  'timestamps': true,
  'follow': true,
  'nocache': true,
};

describe('compose', () => {
  test.todo('should include a --project for every command');
  test.todo('should include potentially more than one --file for every command');
  test.todo('should include potentially more than one -e for every command when opts.environment is set');
  test.todo('should include a --user for every command when opts.user is set');
  test.todo('should include a string escaped --entrypoint for every command when opts.entrypoint is set');
  test.todo('should include services as arguments when opts.services is set for every command');
  test.todo('should include a command as an argument when opts.cmd is set for the run command');
  test.todo('should return an object with array cmd and object opts');

  describe('#build', () => {
    test.todo('should return the correct default options when not specified');
    test('#build should return an object.', () => {
      const buildResult = compose.build(
        ['string1', 'string2'],
        'my_project',
        myOpts,
      );
      expect(typeof buildResult).toBe('object');
    });

    test('#build should throw and error if project string is not defined.', () => {
      expect(() => {
        compose.build(
          ['string test'],
          null,
          myOpts,
        );
      }).toThrow(Error);
    });
  });

  describe('#getId', () => {
    test.todo('should return the correct default options when not specified');
    test('#getId should return an object.', () => {
      const getIdResult = compose.getId(
        ['string1', 'string2'],
        'my_project',
        myOpts,
      );
      expect(typeof getIdResult).toBe('object');
    });
  });

  describe('#logs', () => {
    test.todo('should return the correct default options when not specified');
    test('#logs should return an object.', () => {
      const logsResult = compose.logs(['string1', 'string2'], 'my_project', {'pull': true});
      expect(typeof logsResult).toBe('object');
    });
  });

  describe('#pull', () => {
    test.todo('should return the correct default options when not specified');
    test.todo('should only pull services specified by the user in opts.services');
    test.todo('should not pull any services that are beind built locally');
    test('#pull should return an object.', () => {
      const pullResult = compose.pull(
        ['string1', 'string2'],
        'my_project',
        myOpts,
      );
      expect(typeof pullResult).toBe('object');
    });
  });

  describe('#remove', () => {
    test.todo('should use down when opts.purge is true');
    test.todo('should use rm when opts.purge is false');
    test.todo('should return the correct default options for down when not specified');
    test.todo('should return the correct default options for remove when not specified');
    test('#remove should return an object.', () => {
      const removeResult = compose.remove(
        ['string1', 'string2'],
        'my_project',
        myOpts,
      );
      expect(typeof removeResult).toBe('object');
    });
  });

  describe('#run', () => {
    test.todo('should return the correct default options when not specified');
    test.todo('should correctly escape opts.cmd');
    test.todo('should prefix any opts.pre to opts.cmd');
    test.todo('should set opts.cmd into an array at index 2 with /bin/sh and -c as indeces 0 and 1');
    test('#run should return an object.', () => {
      const runResult = compose.run(
        ['string1', 'string2'],
        'my_project',
        myOpts,
      );
      expect(typeof runResult).toBe('object');
    });
  });

  describe('#start', () => {
    test.todo('should return the correct default options when not specified');
    test('#start should return an object.', () => {
      const startResult = compose.start(
        ['string1', 'string2'],
        'my_project',
        myOpts,
      );
      expect(typeof startResult).toBe('object');
    });

    test('#start without options should work.', () => {
      const startResult = compose.start(
        ['string'],
        'a_project',
        false,
      );
      expect(typeof startResult).toBe('object');
    });

    test('#start with entrypoint as a string should return an object.', () => {
      const opts = {...myOpts, entrypoint: 'astring', cmd: 'acommand'};
      const startResult = compose.start(
        ['string test'],
        'another_project',
        opts,
      );
      expect(typeof startResult).toBe('object');
    });

    test('#start with no opts (false).', () => {
      const startResult = compose.start(
        ['string test'],
        'another_project',
        myOpts,
      );
      expect(typeof startResult).toBe('object');
    });

    test('#start with cmd as a string should still return and object.', () => {
      const opts = {...myOpts, cmd: ['cmdstring']};
      const startResult = compose.start(
        ['string test'],
        'one_project_more',
        opts,
      );
      expect(typeof startResult).toBe('object');
    });
  });

  describe('#stop', () => {
    test.todo('should return the correct default options when not specified');
    test('#stop should return an object.', () => {
      const stopResult = compose.stop(
        ['string1', 'string2'],
        'my_project',
        myOpts,
      );
      expect(typeof stopResult).toBe('object');
    });
  });
});
