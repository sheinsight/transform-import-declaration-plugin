import type { PluginObj, NodePath } from '@babel/core';
import type {
  ImportDeclaration,
  ImportSpecifier,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier
} from '@babel/types';
import * as t from '@babel/types';
import type { PluginConfig } from './types';
import { transformFilename, configMatches, validateConfig } from './transform';

/**
 * Babel 插件：转换导入声明
 */
export default function transformImportDeclarationPlugin(): PluginObj {
  return {
    name: 'transform-import-declaration',

    visitor: {
      Program: {
        enter(_, state) {
          // 在程序开始时验证配置
          const config = state.opts as PluginConfig;
          if (!config || !config.config) {
            throw new Error('Missing plugin configuration');
          }
          validateConfig(config.config);
        }
      },

      ImportDeclaration(path: NodePath<ImportDeclaration>, state) {
        const config = state.opts as PluginConfig;
        const node = path.node;

        // Skip type-only imports (e.g., import type { Foo } from 'bar')
        if (node.importKind === 'type') {
          return;
        }

        // 获取源模块名称
        const source = node.source.value;

        // 查找所有匹配此 source 的配置
        const matchingConfigs = config.config.filter(c => c.source === source);

        if (matchingConfigs.length === 0) {
          return;
        }

        // 收集需要转换的命名导入 (排除 type-only 导入)
        const namedImports = node.specifiers.filter(
          spec => spec.type === 'ImportSpecifier' && spec.importKind !== 'type'
        ) as ImportSpecifier[];

        if (namedImports.length === 0) {
          return;
        }

        // 收集未被处理的导入说明符 (包括非命名导入和 type-only 导入)
        const unprocessedSpecifiers: (ImportDefaultSpecifier | ImportNamespaceSpecifier | ImportSpecifier)[] =
          node.specifiers.filter(spec =>
            spec.type !== 'ImportSpecifier' || spec.importKind === 'type'
          );

        // 创建新的导入声明
        const newImports: any[] = [];

        // 处理每个命名导入
        namedImports.forEach(specifier => {
          const importedName = specifier.imported.type === 'Identifier'
            ? specifier.imported.name
            : specifier.imported.value;
          const localName = specifier.local.name;

          // 尝试找到第一个匹配的配置
          let matchedConfig = null;
          for (const cfg of matchingConfigs) {
            if (configMatches(cfg, importedName)) {
              matchedConfig = cfg;
              break;
            }
          }

          if (!matchedConfig) {
            // 如果没有匹配的配置，保留原始导入
            unprocessedSpecifiers.push(specifier);
            return;
          }

          // 转换文件名
          const filename = transformFilename(importedName, matchedConfig.filename);

          // 生成导入路径
          const paths = matchedConfig.output.map(template =>
            template.replace(/\{\{\s*filename\s*\}\}/g, filename)
          );

          // 确定导入说明符类型
          const specifierType = matchedConfig.specifier || 'default';

          // 第一个路径：主导入（根据 specifier 类型）
          if (paths.length > 0) {
            const mainPath = paths[0];

            switch (specifierType) {
              case 'default':
                // import Button from 'path'
                newImports.push(
                  t.importDeclaration(
                    [t.importDefaultSpecifier(
                      t.identifier(localName)
                    )],
                    t.stringLiteral(mainPath)
                  )
                );
                break;

              case 'named':
                // import { Button } from 'path'
                newImports.push(
                  t.importDeclaration(
                    [t.importSpecifier(
                      t.identifier(localName),
                      t.identifier(importedName)
                    )],
                    t.stringLiteral(mainPath)
                  )
                );
                break;

              case 'namespace':
                // import * as Button from 'path'
                newImports.push(
                  t.importDeclaration(
                    [t.importNamespaceSpecifier(
                      t.identifier(localName)
                    )],
                    t.stringLiteral(mainPath)
                  )
                );
                break;
            }
          }

          // 其余路径：副作用导入
          for (let i = 1; i < paths.length; i++) {
            newImports.push(
              t.importDeclaration(
                [],
                t.stringLiteral(paths[i])
              )
            );
          }
        });

        // 如果所有导入都被处理了，替换原始导入
        if (unprocessedSpecifiers.length === 0) {
          path.replaceWithMultiple(newImports);
        } else {
          // 保留未处理的导入，并添加新的导入
          node.specifiers = unprocessedSpecifiers;
          path.insertAfter(newImports);
        }
      }
    }
  };
}
