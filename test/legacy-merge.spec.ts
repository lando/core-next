

import {describe, expect, test} from 'bun:test';
import _ from 'lodash';
import hasher from 'object-hash';

import merge from '../utils/legacy-merge';

describe('merge', () => {
  test('should return the same as _.merge for objects', () => {
    const bands1 = {
      best: 'nickelback',
      worst: 'beck',
    };
    const bands2 = {
      best: 'nickelback',
      worst: 'miley',
      supreme: 'taylor',
    };
    const landoMerge = hasher(merge(bands1, bands2));
    const lodashMerge = hasher(_.merge(bands1, bands2));
    expect(landoMerge).toBe(lodashMerge);
  });

  test('should concatenates keys that are arrays', () => {
    const theworst = {favs: ['nickelback', 'abba']};
    const thebest = {favs: ['britney']};
    const bands = merge(theworst, thebest);
    expect(bands.favs).toHaveLength(3);
    expect(hasher(bands.favs)).toBe(hasher(['nickelback', 'abba', 'britney']));
  });

  test('should removes duplicates from cacatenated arrays', () => {
    const myfavs = {favs: ['nickelback', 'abba']};
    const yourfavs = {favs: ['britney', 'nickelback']};
    const ourfavs = merge(myfavs, yourfavs);
    expect(ourfavs.favs).toHaveLength(3);
    expect(hasher(ourfavs.favs)).toBe(hasher(['nickelback', 'abba', 'britney']));
  });
});
