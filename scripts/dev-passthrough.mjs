import { createReadStream } from 'node:fs'
import { realpath, stat, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRedirects, isPassthrough } from './site-passthrough.mjs'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
}

/** Serve only the files the static assembler publishes, including installers. */
export function devPassthrough() {
  return {
    name: 'omarchy-passthrough',
    enforce: 'post',
    async configureServer(server) {
      const root = await realpath(
        process.env.OMARCHY_SITE_DIR ?? server.config.root,
      )
      const { plugins } = JSON.parse(
        await readFile(
          new URL('../src/data/plugins.json', import.meta.url),
          'utf8',
        ),
      )
      const redirects = createRedirects(plugins)
      const middleware = async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()
        try {
          const url = new URL(req.url, 'http://localhost')
          const pathname = path.posix.normalize(
            decodeURIComponent(url.pathname),
          )
          if (pathname.includes('\\')) return next()
          const redirect =
            redirects[pathname.endsWith('/') ? pathname : `${pathname}/`]
          if (redirect) {
            res.writeHead(302, { Location: redirect })
            return res.end()
          }
          if (!isPassthrough(pathname)) return next()
          let file = path.resolve(root, `.${pathname}`)
          if (!file.startsWith(`${root}${path.sep}`)) return next()
          let info = await stat(file)
          if (info.isDirectory()) {
            if (!pathname.endsWith('/')) {
              res.writeHead(302, { Location: `${url.pathname}/${url.search}` })
              return res.end()
            }
            file = path.join(file, 'index.html')
            info = await stat(file)
          }
          // Keep symlinks inside the same checkout as well.
          file = await realpath(file)
          if (!file.startsWith(`${root}${path.sep}`) || !info.isFile())
            return next()
          res.writeHead(200, {
            'Content-Type':
              MIME[path.extname(file)] ?? 'text/plain; charset=utf-8',
            'Content-Length': info.size,
          })
          if (req.method === 'HEAD') return res.end()
          createReadStream(file)
            .on('error', (error) => res.destroy(error))
            .pipe(res)
        } catch (error) {
          if (
            error.code === 'ENOENT' ||
            error.code === 'ENOTDIR' ||
            error instanceof URIError
          )
            return next()
          next(error)
        }
      }
      // Serve published files before Astro attempts to match them as page routes.
      return () =>
        server.middlewares.stack.unshift({ route: '', handle: middleware })
    },
  }
}
