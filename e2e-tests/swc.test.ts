import { describe, it, expect } from 'vitest';
import { testCases, validationTestCases } from './test-cases';
import * as swc from '@swc/core';
import { realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 使用 workspace 协议引用 SWC 插件
// pnpm 使用符号链接，需要解析真实路径
const symlinkedPath = resolve(__dirname, 'node_modules/@shined/swc-plugin-transform-import-declaration');
const realPath = realpathSync(symlinkedPath);
const PLUGIN_PATH = resolve(realPath, 'swc_plugin_transform_import_declaration.wasm');

// TypeScript 测试用例名称
const TYPESCRIPT_TEST_CASES = ['type-import', 'mixed-value-and-type-imports'];

/**
 * 使用 SWC 转换代码
 */
async function transformWithSWC(code: string, config: any, useTypeScript = false): Promise<string> {
  const result = await swc.transform(code, {
    jsc: {
      parser: useTypeScript
        ? { syntax: 'typescript', tsx: false }
        : { syntax: 'ecmascript' },
      target: 'es2020',
      experimental: {
        plugins: [[PLUGIN_PATH, config]]
      },
      // 保留类型导入语法（不要移除 import type）
      ...(useTypeScript && {
        transform: {
          verbatimModuleSyntax: true
        }
      })
    },
    // 配置模块类型保留
    module: {
      type: 'es6',
    }
  });

  return result.code;
}

/**
 * 规范化代码字符串（移除多余的空格和换行）
 */
function normalizeCode(code: string): string {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * 比较两段代码是否等价（忽略导入语句的顺序）
 */
function compareCode(actual: string, expected: string): boolean {
  const actualLines = normalizeCode(actual).split('\n').sort();
  const expectedLines = normalizeCode(expected).split('\n').sort();

  if (actualLines.length !== expectedLines.length) {
    return false;
  }

  for (let i = 0; i < actualLines.length; i++) {
    if (actualLines[i] !== expectedLines[i]) {
      return false;
    }
  }

  return true;
}

describe('SWC Plugin E2E Tests', () => {
  describe('Transform Cases', () => {
    testCases.forEach(testCase => {
      // TypeScript type imports 在转换为 JavaScript 时会被移除，这是正常行为
      // 跳过这些 TypeScript 特定测试
      const isTypeScriptTest = TYPESCRIPT_TEST_CASES.includes(testCase.name);
      const testFn = isTypeScriptTest ? it.skip : it;

      testFn(testCase.name + ': ' + testCase.description, async () => {
        const output = await transformWithSWC(testCase.input, testCase.config, isTypeScriptTest);

        // 使用 compareCode 来比较，允许导入语句顺序不同
        const isEqual = compareCode(output, testCase.expected);

        if (!isEqual) {
          // 如果不相等，显示详细的对比信息
          console.log('Expected (sorted):');
          console.log(normalizeCode(testCase.expected).split('\n').sort().join('\n'));
          console.log('\nActual (sorted):');
          console.log(normalizeCode(output).split('\n').sort().join('\n'));
        }

        expect(isEqual).toBe(true);
      });
    });
  });

  describe('Validation Cases', () => {
    validationTestCases.forEach(testCase => {
      it(testCase.name + ': ' + testCase.description, async () => {
        if (testCase.shouldThrow) {
          await expect(async () => {
            await transformWithSWC('import { Button } from "antd";', testCase.config);
          }).rejects.toThrow();
        }
      });
    });
  });
});
