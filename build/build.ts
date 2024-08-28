import { rollup } from 'rollup'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'rollup-plugin-esbuild'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { dts } from 'rollup-plugin-dts'
import pkg from '../package.json' with { type: 'json' }
import { pick } from 'cat-kit/be'
import { writeFile } from 'node:fs/promises'
import { $ } from 'bun'

const __dirname = dirname(fileURLToPath(import.meta.url))
async function build() {
  const bundler = await rollup({
    plugins: [
      commonjs(),
      esbuild({
        minify: false
      }),
      dts({
        compilerOptions: {
          moduleResolution: 100,
          allowJs: true,
          module: 99
        },
        respectExternal: true
      }),
      nodeResolve()
    ],
    input: resolve(__dirname, '../src/index.ts'),
    external: ['vite', /^node:/, 'cat-kit/be']
  })

  await bundler.write({
    format: 'esm',
    dir: resolve(__dirname, '../dist'),
    sourcemap: true
  })

  pkg.version = pkg.version.replace(/\.(\d+)$/, (_, v) => {
    return `.${+v + 1}`
  })

  const _pkg = {
    ...pick(pkg, ['name', 'version', 'peerDependencies', 'type']),
    exports: {
      '.': './index.js',
      './*': './*.js'
    }
  }
  await writeFile(resolve(__dirname, '../package.json'), JSON.stringify(pkg, null, 2))
  await writeFile(resolve(__dirname, '../dist/package.json'), JSON.stringify(_pkg, null, 2))

  await $`cd dist && npm publish --registry=http://192.168.31.250:6005`
}

build()
