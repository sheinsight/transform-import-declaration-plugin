import { describe, it, expect } from 'vitest';
import { transform } from '@babel/core';
import plugin from '../index';
import type { PluginConfig } from '../types';

function transformCode(code: string, config: PluginConfig): string {
  const result = transform(code, {
    plugins: [[plugin, config]],
    configFile: false,
  });

  return result?.code || '';
}

describe('Babel Plugin - Basic Transform', () => {
  it('should transform basic named import to default import', () => {
    const input = `import { Button } from "antd";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).toContain('import Button from "antd/es/button.js"');
  });

  it('should transform multiple named imports', () => {
    const input = `import { Button, DatePicker } from "antd";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).toContain('import Button from "antd/es/button.js"');
    expect(output).toContain('import DatePicker from "antd/es/date-picker.js"');
  });

  it('should generate side-effect imports for styles', () => {
    const input = `import { Button } from "antd";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: [
            'antd/es/{{ filename }}.js',
            'antd/es/{{ filename }}/style/css'
          ]
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).toContain('import Button from "antd/es/button.js"');
    expect(output).toContain('import "antd/es/button/style/css"');
  });

  it('should exclude specified components', () => {
    const input = `import { Button, DatePicker } from "antd";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js'],
          exclude: ['Button']
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).not.toContain('import Button');
    expect(output).toContain('import DatePicker from "antd/es/date-picker.js"');
    expect(output).toContain('import { Button } from "antd"');
  });

  it('should handle multiple configs', () => {
    const input = `import { Button, DatePicker } from "antd";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: [
            'antd/es/{{ filename }}.js',
            'antd/css/{{ filename }}.css'
          ],
          exclude: ['Button']
        },
        {
          source: 'antd',
          filename: 'kebabCase',
          output: [
            'antd/es/{{ filename }}.js',
            'antd/css/{{ filename }}.png'
          ],
          include: ['Button']
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).toContain('import DatePicker from "antd/es/date-picker.js"');
    expect(output).toContain('import "antd/css/date-picker.css"');
    expect(output).toContain('import Button from "antd/es/button.js"');
    expect(output).toContain('import "antd/css/button.png"');
  });

  it('should support named specifier', () => {
    const input = `import { debounce } from "lodash";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'lodash',
          filename: 'kebabCase',
          output: ['lodash/{{ filename }}.js'],
          specifier: 'named'
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).toContain('import { debounce } from "lodash/debounce.js"');
  });

  it('should support namespace specifier', () => {
    const input = `import { DateUtils } from "utils";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'utils',
          filename: 'camelCase',
          output: ['utils/{{ filename }}.js'],
          specifier: 'namespace'
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).toContain('import * as DateUtils from "utils/dateUtils.js"');
  });

  it('should support snake_case filename', () => {
    const input = `import { DatePicker } from "antd";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'antd',
          filename: 'snakeCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).toContain('import DatePicker from "antd/es/date_picker.js"');
  });

  it('should support PascalCase filename', () => {
    const input = `import { DatePicker } from "antd";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'antd',
          filename: 'pascalCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).toContain('import DatePicker from "antd/es/DatePicker.js"');
  });

  it('should preserve non-named imports', () => {
    const input = `import antd, { Button } from "antd";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    };

    const output = transformCode(input, config);
    expect(output).toContain('import antd from "antd"');
    expect(output).toContain('import Button from "antd/es/button.js"');
  });
});

describe('Babel Plugin - Config Validation', () => {
  it('should throw error when both include and exclude are configured', () => {
    const input = `import { Button } from "antd";`;
    const config: PluginConfig = {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js'],
          include: ['Button'],
          exclude: ['Table']
        }
      ]
    };

    expect(() => transformCode(input, config)).toThrow(
      'include 和 exclude 不能同时配置'
    );
  });
});
