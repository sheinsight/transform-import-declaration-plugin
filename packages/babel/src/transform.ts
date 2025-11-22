import { camelCase, pascalCase, snakeCase, paramCase } from 'change-case';
import type { FilenameCase, TransformConfig } from './types';

/**
 * 根据规则转换文件名
 * 使用 change-case 库进行转换
 */
export function transformFilename(name: string, caseType: FilenameCase): string {
  switch (caseType) {
    case 'kebabCase':
      return paramCase(name);
    case 'camelCase':
      return camelCase(name);
    case 'snakeCase':
      return snakeCase(name);
    case 'pascalCase':
      return pascalCase(name);
  }
}

/**
 * 检查配置是否匹配给定的组件名
 */
export function configMatches(config: TransformConfig, name: string): boolean {
  // 如果配置了 include（白名单），只处理列表中的组件
  if (config.include) {
    return config.include.includes(name);
  }

  // 如果配置了 exclude（黑名单），排除列表中的组件
  if (config.exclude) {
    return !config.exclude.includes(name);
  }

  // 没有任何过滤器，匹配所有
  return true;
}

/**
 * 验证配置的有效性
 * @throws {Error} 如果配置无效
 */
export function validateConfig(configs: TransformConfig[]): void {
  configs.forEach((config, index) => {
    if (config.include && config.exclude) {
      throw new Error(
        `Config #${index} (source: '${config.source}'): 'include' and 'exclude' cannot be used together.\n` +
          `Please choose one:\n` +
          `- Use 'include' to specify components to process (whitelist)\n` +
          `- Use 'exclude' to specify components to skip (blacklist)`
      );
    }
  });
}
