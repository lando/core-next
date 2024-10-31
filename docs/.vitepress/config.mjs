import {createRequire} from 'module';

import {defineConfig} from '@lando/vitepress-theme-default-plus/config';
import {default as getBaseUrl} from '@lando/vitepress-theme-default-plus/get-base-url';

const require = createRequire(import.meta.url);

const {name, version} = require('../../package.json');
const landoPlugin = name.replace('@lando/', '');

// get baseUrl
const baseUrl = getBaseUrl();

export default defineConfig({
  title: 'Lando 4',
  description: 'The offical Lando Core 4 docs.',
  landoDocs: 4,
  landoPlugin,
  version,
  base: '/v/next/',
  baseUrl,
  navBaseUrl: '/v/next',
  head: [
    ['meta', {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
    ['link', {rel: 'icon', href: '/core/favicon.ico', size: 'any'}],
    ['link', {rel: 'icon', href: '/core/favicon.svg', type: 'image/svg+xml'}],
  ],
  themeConfig: {
    multiVersionBuild: {
      build: 'dev',
      satisfies: '>=4.0.0',
    },
    sidebarEnder: {
      text: `${landoPlugin}@v${version}`,
      collapsed: true,
      items: [
        {text: 'Release Notes', link: `https://github.com/lando/core-next/releases/tag/v${version}`},
        {text: 'Older Versions', link: `https://github.com/lando/core-next/releases`},
      ],
    },
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
      {
        text: 'Contribution',
        collapsed: false,
        items: [
          {text: 'Development', link: '/development'},
          {text: 'Team', link: '/team'},
        ],
      },
      {
        text: 'Help & Support',
        collapsed: false,
        items: [
          {text: 'GitHub', link: 'https://github.com/lando/core-next/issues/new/choose'},
          {text: 'Slack', link: 'https://www.launchpass.com/devwithlando'},
          {text: 'Contact Us', link: '/support'},
        ],
      },
      {
        text: 'Examples',
        link: 'https://github.com/lando/core-next/tree/main/examples',
      },
    ],
  },
});

