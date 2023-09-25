import {defineUserConfig} from '@vuepress/cli';
import {defaultThemePlus} from '@lando/vuepress-theme-default-plus';

export default defineUserConfig({
  lang: 'en-US',
  title: 'Lando 4',
  description: 'Lando 4 Config Docs.',
  base: '/core/v4/',
  head: [
    ['meta', {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
    ['link', {rel: 'icon', href: '/config/favicon.ico', size: 'any'}],
    ['link', {rel: 'icon', href: '/config/favicon.svg', type: 'image/svg+xml'}],
    ['link', {rel: 'preconnect', href: '//fonts.googleapis.com'}],
    ['link', {rel: 'preconnect', href: '//fonts.gstatic.com', crossorigin: true}],
    ['link', {rel: 'stylesheet', href: '//fonts.googleapis.com/css2?family=Lexend:wght@500&display=swap'}],
  ],
  theme: defaultThemePlus({
    landoDocs: 4,
    logo: '/images/icon.svg',
    docsDir: 'docs',
    docsBranch: 'main',
    repo: 'lando/core-next',
    sidebarHeader: {
      enabled: true,
      title: 'Core',
      icon: '/images/icon.png',
    },
    versionsPage: {
      auto: true,
      trimLatest: true,
      showEdge: true,
    },
    alert: {
      content: 'These docs are for highly experimental features. Are you looking for the Lando 3 docs? You can go to them <a href="https://docs.lando.dev/core/v3/">here</a>.',
      scheme: 'neutral',
      closeable: true,
    },
    sidebar: [
      '/index.html',
      {
        text: 'Landofile',
        collapsible: true,
        children: [
          {text: 'Services', link: '/landofile/services.html'},
        ],
      },
      {
        text: 'Services',
        collapsible: true,
        children: [
          {text: 'L-337', link: '/services/l337.html'},
        ],
      },
      '/support.html',
    ],
  }),
});
