import { kebabCase, existModule } from 'cat-kit/be'

interface Options {
  /**
   * 组件前缀
   * U为ultra-ui组件,M为@meta/components组件
   */
  prefix: 'U' | 'M' | string
  /** 指定从哪个库(包)导入 */
  lib: 'ultra-ui' | '@meta/components' | string
  /**
   * 样式副作用导入
   * @param kebabName 组件的烤串命名(kebab-name)
   * @param lib 库
   * @returns
   */
  sideEffects: (kebabName: string, lib: string) => string | undefined
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

      const styleModuleId = sideEffects(kebabName, lib)

      if (styleModuleId) {
        info.sideEffects = styleModuleId
      }

      return info
    }
  }

  return resolver
}

export const UltraUIResolver = autoResolveComponent({
  prefix: 'U',
  lib: 'ultra-ui',
  sideEffects(kebabName, lib) {
    let moduleId = `${lib}/components/${kebabName}/style.js`

    while (!existModule(moduleId)) {
      const preKebabName = kebabName
      kebabName = kebabName.replace(/-[a-z]$/, '')
      if (preKebabName === kebabName) return
      moduleId = `${lib}/components/${kebabName}/style.js`
    }

    return moduleId
  }
})
export const MetaComponentsResolver = autoResolveComponent({
  prefix: 'M',
  lib: '@meta/components',
  sideEffects(kebabName, lib) {
    let moduleId = `${lib}/${kebabName}/style.js`

    while (!existModule(moduleId)) {
      const preKebabName = kebabName
      kebabName = kebabName.replace(/-[a-z]$/, '')
      if (preKebabName === kebabName) return
      moduleId = `${lib}/${kebabName}/style.js`
    }

    return moduleId
  }
})
