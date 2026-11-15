import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve(process.cwd(), 'dist');
if (!existsSync(distDir)) {
  process.exit(0);
}

const basePath = process.env.VITE_BASE_PATH || '/';
const segmentCount = basePath === '/' ? 0 : basePath.replace(/^\/|\/$/g, '').split('/').length;

// Standard spa-github-pages 404 redirect preserving subpath base
const html404 = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>TIANEDGE — Redirecting</title>
    <script>
      var pathSegmentsToKeep = ${segmentCount};
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>
`;

writeFileSync(resolve(distDir, '404.html'), html404, 'utf8');
console.log('Generated dist/404.html for GitHub Pages SPA routing (keepSegments=' + segmentCount + ').');
