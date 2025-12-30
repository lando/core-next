'use strict';

const {describe, expect, test, jest, afterEach} = require('bun:test');
const _ = require('lodash');
const axios = require('axios');
const EventEmitter = require('events').EventEmitter;
const Promise = require('./../lib/promise');

const Metrics = require('./../lib/metrics');

describe('metrics', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#Metrics', () => {
    test('should return a Metrics instance with correct default options', () => {
      const metrics = new Metrics();
      expect(metrics).toBeInstanceOf(Metrics);
      expect(metrics.id).toBe('unknown');
      expect(metrics.endpoints).toBeInstanceOf(Array);
      expect(metrics.endpoints.length).toBe(0);
      expect(metrics.data).toBeInstanceOf(Object);
      expect(Object.keys(metrics.data).length).toBe(0);
      expect(metrics.log).toBeInstanceOf(EventEmitter);
    });

    test('should return a Metrics instance with user options', () => {
      const metrics = new Metrics({id: '24601', endpoints: [1, 2], data: {prisoner: 'valjean'}});
      expect(metrics).toBeInstanceOf(Metrics);
      expect(metrics.id).toBe('24601');
      expect(metrics.data.prisoner).toBe('valjean');
      expect(metrics.endpoints.length).toBe(2);
      expect(metrics.endpoints.length).toBeGreaterThan(0);
      expect(Object.keys(metrics.data).length).toBeGreaterThan(0);
      expect(metrics.log).toBeInstanceOf(EventEmitter);
    });
  });

  describe('#report', () => {
    test('should report to each report=true endpoint', async () => {
      const endpoints = [
        {url: 'https://place.for.the.things/metrics', report: true},
        {url: 'https://place.for.more.things', report: true},
        {url: 'https://nsa.gov/prism', report: false},
      ];
      let counter = 0;
      const id = '24601';
      const reportable = _.size(_.filter(endpoints, endpoint => endpoint.report));
      const metrics = new Metrics({id, endpoints, data: {prisoner: 'valjean'}});
      jest.spyOn(axios, 'create').mockImplementation(({baseURL = 'localhost'} = {}) => ({
        post: (path, data) => {
          expect(baseURL).toBe(endpoints[counter].url);
          expect(path).toBe('/metrics/v2/' + id);
          expect(data.prisoner).toBe('valjean');
          expect(data.inspecter).toBe('javier');
          expect(data.created).toBeTruthy();
          expect(data.action).toBe('escape');
          counter = counter + 1;
          return Promise.resolve();
        },
      }));
      await metrics.report('escape', {inspecter: 'javier'});
      expect(counter).toBe(reportable);
    });

    test('should log a failed report but not throw an error', async () => {
      const endpoints = [
        {url: 'https://place.for.the.things/metrics', report: true},
        {url: 'https://place.for.more.things', report: true},
        {url: 'https://nsa.gov/prism', report: true},
      ];
      const metrics = new Metrics({endpoints, log: {debug: jest.fn(), verbose: jest.fn()}});
      jest.spyOn(axios, 'create').mockImplementation(() => ({
        post: () => Promise.reject(new Error('Network error')),
      }));
      const result = await metrics.report();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should properly reset the data from previous reports', async () => {
      const endpoints = [{url: 'https://place.for.the.things/metrics', report: true}];
      const metrics = new Metrics({endpoints, data: {inspector: 'javier'}});
      jest.spyOn(axios, 'create').mockImplementation(() => ({
        post: (path, data) => {
          if (data.action === 'escape') expect(data).toHaveProperty('freedman', 'valjean');
          if (data.action === 'apprehended') expect(data).not.toHaveProperty('freedman');
          return Promise.resolve();
        },
      }));
      await metrics.report('escape', {freedman: 'valjean'});
      await new Promise(resolve => setTimeout(resolve, 5));
      await metrics.report('apprehended', {prisoner: 'valjean'});
    });
  });
});
