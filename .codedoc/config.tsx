
import { configuration } from '@codedoc/core';
import { StaticRenderer } from '@connectv/sdh';
import { codingBlog } from '@codedoc/coding-blog-plugin';
import register from 'jsdom-global';

import { theme } from './theme';

const renderer = new StaticRenderer();
register();

export const config = /*#__PURE__*/configuration({
  theme,
  src: {
    base: 'posts'
  },
  dest: {
    namespace: '/blog',    // --> change this if you want to also deploy to GitHub Pages
    html: 'dist',
    assets: process.env.GITHUB_BUILD === 'true' ? 'dist' : '.',
    bundle: process.env.GITHUB_BUILD === 'true' ? 'bundle' : 'dist/bundle',
    styles: process.env.GITHUB_BUILD === 'true' ? 'styles' : 'dist/styles',
  },
  page: {
    title: {
      base: 'Blog'         // --> change this to change your blog's title
    },
    favicon: '/favicon.ico',
    scripts: [<script>{`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-160017120-1');
`}</script>, <script async src="https://www.googletagmanager.com/gtag/js?id=UA-160017120-1"></script>],
    stylesheets: [<style>{`.inside {justify-content: center}`}</style>]
  },
  plugins: [
    codingBlog({
      assets: [
        'img',
        'favicon.ico',
      ],
      feed: {
        url: "https://evan.tatarka.me"
      }
    })
  ],
  misc: {
    github: {
      repo: 'blog',
      user: 'evant'
    }
  }
});
