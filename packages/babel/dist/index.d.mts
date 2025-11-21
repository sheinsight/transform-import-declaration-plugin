import { PluginObj } from '@babel/core';

/**
 * Babel 插件：转换导入声明
 */
declare function transformImportDeclarationPlugin(): PluginObj;

export { transformImportDeclarationPlugin as default };
