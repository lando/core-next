import { defineConfig } from '@lando/vitepress-theme-default-plus/config';
import { default as getBaseUrl } from '@lando/vitepress-theme-default-plus/get-base-url';
import { default as isDevRelease } from '@lando/vitepress-theme-default-plus/is-dev-release';
import pjson from '../../package.json';

const landoPlugin = pjson.name.replace('@lando/', '');

// backwards compat with LANDO_MVB_VERSION
if (!process?.env?.VPL_MVB_VERSION && process?.env?.LANDO_MVB_VERSION) {
  process.env.VPL_MVB_VERSION = process.env.LANDO_MVB_VERSION;
}

// allow version to imported from ENV which is nice for one-off dev builds
const version = process?.env?.VPL_MVB_VERSION ? process.env.VPL_MVB_VERSION : `v${pjson.version}`;

// get baseUrl
const baseUrl = getBaseUrl();

const sidebarEnder = {
  text: version,
  collapsed: true,
  items: [
    {
      text: 'Other Doc Versions',
      items: [
        { text: 'stable', target: '_blank', link: '../../v/stable/' },
        { text: 'edge', target: '_blank', link: '../../v/edge/' },
        { text: '<strong>see all versions</strong>', target: '_blank', link: '../../v/' },
      ],
    },
    { text: 'Other Releases', link: 'https://github.com/lando/core-next/releases' },
  ],
};

if (sidebarEnder && !isDevRelease(version)) {
  sidebarEnder.items.splice(1, 0, {
    text: 'Release Notes',
    link: `https://github.com/lando/core-next/releases/releases/tag/${version}`,
  });
}

export default defineConfig({
  title: 'Lando 4',
  description: 'The offical Lando 4 docs.',
  landoDocs: 4,
  landoPlugin,
  version,
  base: '/v/next/',
  baseUrl,
  navBaseUrl: 'https://docs.lando.dev/v/next',
  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    ['link', { rel: 'icon', href: '/favicon.ico', size: 'any' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],
  themeConfig: {
    internalDomains: [
      '^https:\/\/lando-core-next\.netlify\.app(\/.*)?$', // eslint-disable-line no-useless-escape
      '^https:\/\/[a-zA-Z0-9-]+--lando-core-next\.netlify\.app(\/.*)?$', // eslint-disable-line no-useless-escape
    ],
    multiVersionBuild: {
      build: 'dev',
      satisfies: '>=4.0.0',
    },
    sidebarEnder,
    sidebar: [
      {
        text: 'Landofile',
        collapsed: false,
        items: [{ text: 'Services', link: '/landofile/services.html' }],
      },
      {
        text: 'Services',
        collapsed: false,
        items: [{ text: 'L-337', link: '/services/l337.html' }],
      },
      {
        text: 'Contribution',
        collapsed: false,
        items: [
          { text: 'Development', link: '/development' },
          { text: 'Team', link: '/team' },
        ],
      },
      {
        text: 'Help & Support',
        collapsed: false,
        items: [
          { text: 'GitHub', link: 'https://github.com/lando/core-next/issues/new/choose' },
          { text: 'Slack', link: 'https://www.launchpass.com/devwithlando' },
          { text: 'Contact Us', link: '/support' },
        ],
      },
      {
        text: 'Examples',
        link: 'https://github.com/lando/core-next/tree/main/examples',
      },
    ],
  },
});
