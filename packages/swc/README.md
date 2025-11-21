# @shined/swc-plugin-transform-import-declaration

An SWC plugin for transforming import declarations to enable tree-shaking and on-demand loading, reducing bundle size and improving application performance.

## Installation

```bash
npm install @shined/swc-plugin-transform-import-declaration --save-dev
# or
yarn add @shined/swc-plugin-transform-import-declaration -D
# or
pnpm add @shined/swc-plugin-transform-import-declaration -D
```

## Features

- **Tree-shaking Support**: Transform named imports to reduce bundle size
- **On-demand Loading**: Import only the components you need
- **Flexible Configuration**: Support multiple transformation rules
- **Style Import**: Automatically import component styles
- **Case Transformation**: Support multiple filename case styles (kebab-case, camelCase, snake_case, PascalCase)
- **Import Specifier Types**: Support default, named, and namespace imports
- **High Performance**: Built with Rust for blazing fast compilation

## Usage

### SWC Configuration

Add the plugin to your `.swcrc` or `swc` configuration:

```json
{
  "jsc": {
    "experimental": {
      "plugins": [
        [
          "@shined/swc-plugin-transform-import-declaration",
          {
            "config": [
              {
                "source": "antd",
                "filename": "kebabCase",
                "output": ["antd/es/{{ filename }}"]
              }
            ]
          }
        ]
      ]
    }
  }
}
```

### With Rspack/Webpack

```js
// rspack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              experimental: {
                plugins: [
                  [
                    '@shined/swc-plugin-transform-import-declaration',
                    {
                      config: [
                        {
                          source: 'antd',
                          filename: 'kebabCase',
                          output: ['antd/es/{{ filename }}']
                        }
                      ]
                    }
                  ]
                ]
              }
            }
          }
        }
      }
    ]
  }
};
```

### Basic Transformation

Input:

```js
import { Button, DatePicker } from 'antd';
```

Output:

```js
import Button from 'antd/es/button';
import DatePicker from 'antd/es/date-picker';
```

### Import with Styles

Configuration:

```json
{
  "config": [
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": [
        "antd/es/{{ filename }}",
        "antd/es/{{ filename }}/style/css"
      ]
    }
  ]
}
```

Input:

```js
import { Button } from 'antd';
```

Output:

```js
import Button from 'antd/es/button';
import 'antd/es/button/style/css';
```

### Include/Exclude Components

#### Exclude Specific Components

```json
{
  "config": [
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": ["antd/es/{{ filename }}"],
      "exclude": ["Button", "Input"]
    }
  ]
}
```

#### Include Specific Components

```json
{
  "config": [
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": ["antd/es/{{ filename }}"],
      "include": ["Button", "Input"]
    }
  ]
}
```

**Note**: `include` and `exclude` cannot be used together.

### Import Specifier Types

#### Default Import (default)

```json
{
  "config": [
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": ["antd/es/{{ filename }}"],
      "specifier": "default"
    }
  ]
}
```

Transforms to: `import Button from 'antd/es/button';`

#### Named Import

```json
{
  "config": [
    {
      "source": "lodash",
      "filename": "kebabCase",
      "output": ["lodash/{{ filename }}"],
      "specifier": "named"
    }
  ]
}
```

Transforms to: `import { debounce } from 'lodash/debounce';`

#### Namespace Import

```json
{
  "config": [
    {
      "source": "utils",
      "filename": "camelCase",
      "output": ["utils/{{ filename }}"],
      "specifier": "namespace"
    }
  ]
}
```

Transforms to: `import * as DateUtils from 'utils/dateUtils';`

### Filename Case Styles

The plugin supports multiple case transformation styles:

| Case Style | Example Transformation |
|-----------|----------------------|
| `kebabCase` | `DatePicker` → `date-picker` |
| `camelCase` | `DatePicker` → `datePicker` |
| `snakeCase` | `DatePicker` → `date_picker` |
| `pascalCase` | `DatePicker` → `DatePicker` |

Example configuration:

```json
{
  "config": [
    {
      "source": "my-lib",
      "filename": "kebabCase",
      "output": ["my-lib/{{ filename }}"]
    }
  ]
}
```

### Multiple Configurations

Define multiple transformation rules for the same library:

```json
{
  "config": [
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": ["antd/es/{{ filename }}", "antd/es/{{ filename }}/style/css"],
      "exclude": ["Button"]
    },
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": ["antd/es/{{ filename }}", "antd/es/{{ filename }}/style/less"],
      "include": ["Button"]
    }
  ]
}
```

## Configuration Options

### TransformConfig

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| source | string | Yes | - | Source module name to transform |
| filename | string | Yes | - | Case style: `kebabCase`, `camelCase`, `snakeCase`, or `pascalCase` |
| output | string[] | Yes | - | Output path templates, use `{{ filename }}` as placeholder |
| specifier | string | No | `"default"` | Import type: `default`, `named`, or `namespace` |
| include | string[] | No | - | Only transform these component names |
| exclude | string[] | No | - | Exclude these component names from transformation |

**Note**: `include` and `exclude` are mutually exclusive.

## Common Use Cases

### Ant Design

```json
{
  "config": [
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": [
        "antd/es/{{ filename }}",
        "antd/es/{{ filename }}/style/css"
      ]
    }
  ]
}
```

### Lodash

```json
{
  "config": [
    {
      "source": "lodash",
      "filename": "kebabCase",
      "output": ["lodash/{{ filename }}"],
      "specifier": "named"
    }
  ]
}
```

### Element Plus

```json
{
  "config": [
    {
      "source": "element-plus",
      "filename": "kebabCase",
      "output": [
        "element-plus/es/components/{{ filename }}",
        "element-plus/es/components/{{ filename }}/style/css"
      ]
    }
  ]
}
```

## Compatibility

- **SWC**: Core library
- **Node.js**: >=14.0.0
- **Rspack**: Compatible with rspack's SWC loader
- **Webpack**: Compatible with swc-loader

## Performance

SWC plugins are written in Rust and compiled to WebAssembly, providing significantly faster compilation times compared to Babel plugins. This plugin leverages SWC's performance benefits while offering the same transformation capabilities.

## Type-Only Imports

The plugin automatically skips type-only imports:

```typescript
// These will NOT be transformed
import type { ButtonProps } from 'antd';
import { type InputProps, Button } from 'antd';

// Only Button will be transformed
```

## Comparison with Babel Plugin

This SWC plugin provides the same functionality as `@shined/babel-plugin-transform-import-declaration` but with the performance benefits of SWC:

- **Faster compilation**: Written in Rust, compiled to WebAssembly
- **Same features**: Identical transformation rules and configuration
- **Drop-in replacement**: Use the same configuration format
- **Better for large projects**: Significantly reduces build times

## Troubleshooting

### Plugin Not Working

1. Ensure the plugin is correctly installed
2. Check that the plugin name is correct in your configuration
3. Verify that SWC experimental plugins are enabled
4. Check your SWC version compatibility

### Import Paths Not Correct

- Verify the `output` path templates match your library structure
- Check the `filename` case style matches your library's file naming convention
- Ensure `{{ filename }}` placeholder is used correctly

## License

MIT

## Author

ityuany

## Related Packages

- **[@shined/babel-plugin-transform-import-declaration](https://www.npmjs.com/package/@shined/babel-plugin-transform-import-declaration)** - Babel version of this plugin

## Issues & Contributions

Found a bug or want to contribute? Visit our [GitHub repository](https://github.com/ityuany/transform-import-declaration-plugin).
