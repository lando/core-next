import {createRequire} from 'module';

import {defineConfig} from '@lando/vitepress-theme-default-plus/config';

const require = createRequire(import.meta.url);

const {name, version} = require('../../package.json');
const landoPlugin = name.replace('@lando/', '');

export default defineConfig({
  title: 'Lando Core 4',
  description: 'The offical Lando Core 4 docs.',
  landoDocs: 4,
  landoPlugin,
  version,
  base: '/core/v4/',
  head: [
    ['meta', {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
    ['link', {rel: 'icon', href: '/core/favicon.ico', size: 'any'}],
    ['link', {rel: 'icon', href: '/core/favicon.svg', type: 'image/svg+xml'}],
  ],
  themeConfig: {
    sidebar: [
      {
        text: 'Landofile',
        collapsed: false,
        items: [
          {text: 'Services', link: '/landofile/services.html'},
        ],
      },
      {
        text: 'Services',
        collapsed: false,
        items: [
          {text: 'L-337', link: '/services/l337.html'},
        ],
      },
      '/support.html',
    ],
  },
});

