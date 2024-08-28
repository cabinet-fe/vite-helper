import { kebabCase } from 'cat-kit/be'
import { existsSync } from 'node:fs'

interface Options {
  /**
   * 组件前缀
   * U为ultra-ui组件,M为@meta/components组件
   */
  prefix: 'U' | 'M' | string
  /** 指定从哪个库(包)导入 */
  lib: 'ultra-ui' | '@meta/components' | string
  /**
   * 样式文件入口
   */
  sideEffects: (kebabName: string) => string
}

interface ComponentInfo {
  name?: string
  from: string
  sideEffects?: string
}

/**
 * 自动解析组件
 * @param options 选项
 * @returns
 */
export function autoResolveComponent(
  options: Options
): (componentName: string) => ComponentInfo | undefined {
  const { prefix, lib, sideEffects } = options

  // 这里的componentName为大驼峰的写法
  function resolver(componentName: string) {
    if (componentName.startsWith(prefix)) {
      const kebabName = kebabCase(componentName.slice(prefix.length))

      const info: ComponentInfo = {
        name: componentName,
        from: lib
      }

      const stylePath = sideEffects(kebabName)

      const styleExist = existsSync(stylePath)

      if (styleExist) {
        info.sideEffects = stylePath
      }
      return info
    }
  }

  return resolver
}
