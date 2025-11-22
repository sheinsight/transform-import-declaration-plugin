import { describe, it, expect } from 'vitest';
import { transform } from '@babel/core';
import babelPlugin from '@shined/babel-plugin-transform-import-declaration';
import { testCases, validationTestCases } from './test-cases';

/**
 * 使用 Babel 转换代码
 */
function transformWithBabel(code: string, config: any): string {
  const result = transform(code, {
    plugins: [[babelPlugin, config]],
    configFile: false,
    parserOpts: {
      // Enable TypeScript parsing to support type imports
      plugins: ['typescript']
    }
  });

  return result?.code || '';
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

describe('Babel Plugin E2E Tests', () => {
  describe('Transform Cases', () => {
    testCases.forEach(testCase => {
      it(testCase.name + ': ' + testCase.description, () => {
        const output = transformWithBabel(testCase.input, testCase.config);

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
      it(testCase.name + ': ' + testCase.description, () => {
        if (testCase.shouldThrow) {
          expect(() => {
            transformWithBabel('import { Button } from "antd";', testCase.config);
          }).toThrow(testCase.errorMessage);
        }
      });
    });
  });
});
