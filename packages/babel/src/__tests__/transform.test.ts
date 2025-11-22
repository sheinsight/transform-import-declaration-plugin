import { describe, it, expect } from 'vitest';
import { transformFilename, configMatches, validateConfig } from '../transform';
import type { TransformConfig } from '../types';

describe('transformFilename', () => {
  it('should convert to kebab-case', () => {
    expect(transformFilename('Button', 'kebabCase')).toBe('button');
    expect(transformFilename('DatePicker', 'kebabCase')).toBe('date-picker');
    expect(transformFilename('MyComponent', 'kebabCase')).toBe('my-component');
  });

  it('should convert to camelCase', () => {
    expect(transformFilename('Button', 'camelCase')).toBe('button');
    expect(transformFilename('DatePicker', 'camelCase')).toBe('datePicker');
    expect(transformFilename('MyComponent', 'camelCase')).toBe('myComponent');
  });

  it('should convert to snake_case', () => {
    expect(transformFilename('Button', 'snakeCase')).toBe('button');
    expect(transformFilename('DatePicker', 'snakeCase')).toBe('date_picker');
    expect(transformFilename('MyComponent', 'snakeCase')).toBe('my_component');
  });

  it('should keep PascalCase', () => {
    expect(transformFilename('Button', 'pascalCase')).toBe('Button');
    expect(transformFilename('DatePicker', 'pascalCase')).toBe('DatePicker');
    expect(transformFilename('MyComponent', 'pascalCase')).toBe('MyComponent');
  });
});

describe('configMatches', () => {
  it('should match when include contains the name', () => {
    const config: TransformConfig = {
      source: 'antd',
      filename: 'kebabCase',
      output: ['antd/es/{{ filename }}.js'],
      include: ['Button', 'Table']
    };

    expect(configMatches(config, 'Button')).toBe(true);
    expect(configMatches(config, 'Table')).toBe(true);
    expect(configMatches(config, 'Form')).toBe(false);
  });

  it('should not match when exclude contains the name', () => {
    const config: TransformConfig = {
      source: 'antd',
      filename: 'kebabCase',
      output: ['antd/es/{{ filename }}.js'],
      exclude: ['Button', 'Table']
    };

    expect(configMatches(config, 'Button')).toBe(false);
    expect(configMatches(config, 'Table')).toBe(false);
    expect(configMatches(config, 'Form')).toBe(true);
  });

  it('should match all when no filters are set', () => {
    const config: TransformConfig = {
      source: 'antd',
      filename: 'kebabCase',
      output: ['antd/es/{{ filename }}.js']
    };

    expect(configMatches(config, 'Button')).toBe(true);
    expect(configMatches(config, 'Table')).toBe(true);
    expect(configMatches(config, 'Form')).toBe(true);
  });
});

describe('validateConfig', () => {
  it('should throw error when both include and exclude are configured', () => {
    const configs: TransformConfig[] = [
      {
        source: 'antd',
        filename: 'kebabCase',
        output: ['antd/es/{{ filename }}.js'],
        include: ['Button'],
        exclude: ['Table']
      }
    ];

    expect(() => validateConfig(configs)).toThrow(
      "'include' and 'exclude' cannot be used together"
    );
  });

  it('should not throw when only include is configured', () => {
    const configs: TransformConfig[] = [
      {
        source: 'antd',
        filename: 'kebabCase',
        output: ['antd/es/{{ filename }}.js'],
        include: ['Button']
      }
    ];

    expect(() => validateConfig(configs)).not.toThrow();
  });

  it('should not throw when only exclude is configured', () => {
    const configs: TransformConfig[] = [
      {
        source: 'antd',
        filename: 'kebabCase',
        output: ['antd/es/{{ filename }}.js'],
        exclude: ['Button']
      }
    ];

    expect(() => validateConfig(configs)).not.toThrow();
  });

  it('should not throw when neither include nor exclude is configured', () => {
    const configs: TransformConfig[] = [
      {
        source: 'antd',
        filename: 'kebabCase',
        output: ['antd/es/{{ filename }}.js']
      }
    ];

    expect(() => validateConfig(configs)).not.toThrow();
  });
});
