import type { HttpProxy, ProxyOptions } from 'vite'
import pc from 'picocolors'
import { date, n } from 'cat-kit/be'

type APIProxy = Record<string, string | ProxyOptions>

const methodColorDict = {
  GET: 'green',
  PUT: 'yellow',
  DELETE: 'red',
  POST: 'blue',
  PATCH: 'yellow'
} as const

const map = new WeakMap()

const configure = (proxy: HttpProxy.Server, options: ProxyOptions) => {
  proxy.on('proxyRes', (proxyRes, req, res) => {
    const url = options.target + (req.url ?? '')
    const methodColor =
      methodColorDict[req.method as keyof typeof methodColorDict]
    const method = pc[methodColor](req.method)

    const resTime = date()
    const reqTime = map.get(req)

    const duration = resTime.timestamp - reqTime

    const resTimeStr = pc.gray(resTime.format('HH:mm:ss'))
    const reqTimeStr = pc.gray(date(reqTime).format('HH:mm:ss'))
    map.delete(req)

    console.log(`${reqTimeStr} -> ${method} ${pc.cyan(url)}`)

    let response = pc.green(proxyRes.statusCode)
    if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
      response = pc.red(proxyRes.statusCode)
    }

    const durationStr = `${n(duration / 1000).fixed(2)}s`
    console.log(`${resTimeStr} <- ${response} 花费: ${durationStr} \n`)

    if (proxyRes.statusCode === 0) {
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]!)
      })

      res.end(
        JSON.stringify({
          data: null,
          code: 510,
          message: '服务器问题, 找后端'
        })
      )
    }
  })

  proxy.on('proxyReq', (proxyReq, req, res) => {
    map.set(req, date().timestamp)
  })

  proxy.on('error', err => {
    console.error(pc.red(err.message))
  })
}

/**
 * 配置开发服务代理
 * @param proxyRules 代理规则
 * @example
 * ```ts
 * defineServerProxy({
 *   // 命中所有/dev开头的url
 *   '/dev': {
 *     // 代理的目标服务器
 *     target: 'http:192.168.1.114:6666',
 *     // 到目标服务器后移除/dev前缀
 *     rewrite: path => path.replace(/^\/dev/, '')
 *   }
 * })
 * ```
 */
export function defineServerProxy<
  P extends APIProxy,
  R extends Record<keyof P, string | ProxyOptions>
>(proxyRules: P): R {
  return Object.fromEntries(
    Object.keys(proxyRules).map((key: string) => {
      const options = proxyRules[key]
      return [
        key,
        {
          changeOrigin: true,
          rewrite(path: string) {
            return path.replace(new RegExp(`^${key}`), '')
          },
          configure,
          ...(typeof options === 'string' ? { target: options } : options)
        }
      ]
    })
  ) as R
}
