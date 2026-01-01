

import {describe, test, expect} from 'bun:test';
import Table from '../lib/table';

describe('table', () => {
  describe('#Table', () => {
    test('should return a Table instance with correct default options', () => {
      const table = new Table();
      expect(table).toBeInstanceOf(Table);
      expect(table.options.head).toHaveLength(0);
      expect(table.border).toBe(true);
      expect(table.sort).toBe(false);
      expect(table.joiner).toBe('\n');
      expect(table.keyColor).toBe('cyan');
      expect(table.options.chars).toHaveProperty('bottom', '─');
    });

    test('should return a Table instance with custom options', () => {
      const table = new Table({}, {border: false, keyColor: 'green', sort: true, joiner: ', '});
      expect(table).toBeInstanceOf(Table);
      expect(table.options.head).toHaveLength(0);
      expect(table.border).toBe(false);
      expect(table.sort).toBe(true);
      expect(table.joiner).toBe(', ');
      expect(table.keyColor).toBe('green');
      expect(table.options.chars).toHaveProperty('bottom', '');
    });
  });

  describe('#add', () => {
    test('should add an objects keys and values as rows', () => {
      const table = new Table({
        taylor: 'swift',
        miley: 'cyrus',
        katy: 'perry',
        ariand: 'grande',
      });
      expect(table).toHaveLength(4);
    });

    test('should join array values with POSIX newline by default', () => {
      const table = new Table();
      table.add({members: ['crosby', 'stills', 'nash', 'young']});
      expect(table[0][1]).toBe(['crosby', 'stills', 'nash', 'young'].join('\n'));
    });

    test('should join array values with alternate opts.arrayJoiner if specified', () => {
      const table = new Table();
      table.add({members: ['crosby', 'stills', 'nash', 'young']}, {joiner: '='});
      expect(table[0][1]).toBe('crosby=stills=nash=young');
    });
  });
});
