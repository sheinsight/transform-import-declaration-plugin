/**
 * 文件名转换规则
 */
export type FilenameCase = 'kebabCase' | 'camelCase' | 'snakeCase' | 'pascalCase';

/**
 * 导入说明符类型
 */
export type SpecifierType = 'default' | 'named' | 'namespace';

/**
 * 转换配置
 */
export interface TransformConfig {
  /**
   * 源模块名称
   */
  source: string;

  /**
   * 文件名转换规则
   */
  filename: FilenameCase;

  /**
   * 输出路径模板数组
   * 第一个为主导入，其余为副作用导入
   */
  output: string[];

  /**
   * 导入说明符类型
   * @default 'default'
   */
  specifier?: SpecifierType;

  /**
   * 只处理列表中的组件名称（白名单）
   */
  include?: string[];

  /**
   * 排除列表中的组件名称（黑名单）
   */
  exclude?: string[];
}

/**
 * 插件配置
 */
export interface PluginConfig {
  config: TransformConfig[];
}
