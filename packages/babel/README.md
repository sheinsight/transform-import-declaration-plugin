# @shined/babel-plugin-transform-import-declaration

A Babel plugin to transform import declarations for tree-shaking and on-demand loading.

## Features

- ✅ Transform named imports to optimized imports
- ✅ Support 4 filename transformation types (kebabCase, camelCase, snakeCase, pascalCase)
- ✅ Support 3 import specifier types (default, named, namespace)
- ✅ Support include/exclude filtering with mutual exclusivity
- ✅ Support multiple transformation rules
- ✅ Support side-effect imports (e.g., styles)
- ✅ Template variable replacement

## Installation

```bash
npm install --save-dev @shined/babel-plugin-transform-import-declaration
# or
pnpm add -D @shined/babel-plugin-transform-import-declaration
# or
yarn add -D @shined/babel-plugin-transform-import-declaration
```

## Usage

### Basic Example

**.babelrc**

```json
{
  "plugins": [
    [
      "@shined/babel-plugin-transform-import-declaration",
      {
        "config": [
          {
            "source": "antd",
            "filename": "kebabCase",
            "output": ["antd/es/{{ filename }}.js"]
          }
        ]
      }
    ]
  ]
}
```

**Input:**

```javascript
import { Button, DatePicker } from 'antd';
```

**Output:**

```javascript
import Button from 'antd/es/button.js';
import DatePicker from 'antd/es/date-picker.js';
```

### With Style Imports

```json
{
  "config": [
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": [
        "antd/es/{{ filename }}.js",
        "antd/es/{{ filename }}/style/css"
      ]
    }
  ]
}
```

**Output:**

```javascript
import Button from 'antd/es/button.js';
import 'antd/es/button/style/css';
import DatePicker from 'antd/es/date-picker.js';
import 'antd/es/date-picker/style/css';
```

### With Exclude

```json
{
  "config": [
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": ["antd/es/{{ filename }}.js"],
      "exclude": ["Button"]
    }
  ]
}
```

**Input:**

```javascript
import { Button, DatePicker } from 'antd';
```

**Output:**

```javascript
import { Button } from 'antd';
import DatePicker from 'antd/es/date-picker.js';
```

### Multiple Configs

```json
{
  "config": [
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": [
        "antd/es/{{ filename }}.js",
        "antd/css/{{ filename }}.css"
      ],
      "exclude": ["Button"]
    },
    {
      "source": "antd",
      "filename": "kebabCase",
      "output": [
        "antd/es/{{ filename }}.js",
        "antd/css/{{ filename }}.png"
      ],
      "include": ["Button"]
    }
  ]
}
```

## Configuration

### TransformConfig

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `source` | string | Yes | - | Source module name to match |
| `filename` | FilenameCase | Yes | - | Filename transformation rule |
| `output` | string[] | Yes | - | Output path templates |
| `specifier` | SpecifierType | No | `'default'` | Import specifier type |
| `include` | string[] | No | - | Only process these components (whitelist) |
| `exclude` | string[] | No | - | Exclude these components (blacklist) |

**Note:** `include` and `exclude` are mutually exclusive. You cannot use both in the same config.

### FilenameCase

| Value | Description | Example |
|-------|-------------|---------|
| `kebabCase` | Lowercase with hyphens | `Button` → `button`, `DatePicker` → `date-picker` |
| `camelCase` | First letter lowercase | `Button` → `button`, `DatePicker` → `datePicker` |
| `snakeCase` | Lowercase with underscores | `Button` → `button`, `DatePicker` → `date_picker` |
| `pascalCase` | Keep as PascalCase | `Button` → `Button`, `DatePicker` → `DatePicker` |

### SpecifierType

| Value | Generated Import | Use Case |
|-------|------------------|----------|
| `default` | `import Button from "path"` | Module uses `export default` |
| `named` | `import { Button } from "path"` | Module uses `export { Button }` |
| `namespace` | `import * as Button from "path"` | Import entire module as object |

## Examples

### Example 1: Basic Transform

```javascript
// Config
{
  "source": "antd",
  "filename": "kebabCase",
  "output": ["antd/es/{{ filename }}.js"]
}

// Input
import { Button } from "antd";

// Output
import Button from "antd/es/button.js";
```

### Example 2: Named Specifier

```javascript
// Config
{
  "source": "lodash",
  "filename": "kebabCase",
  "output": ["lodash/{{ filename }}.js"],
  "specifier": "named"
}

// Input
import { debounce } from "lodash";

// Output
import { debounce } from "lodash/debounce.js";
```

### Example 3: Namespace Specifier

```javascript
// Config
{
  "source": "utils",
  "filename": "camelCase",
  "output": ["utils/{{ filename }}.js"],
  "specifier": "namespace"
}

// Input
import { DateUtils } from "utils";

// Output
import * as DateUtils from "utils/dateUtils.js";
```

### Example 4: Different Filename Cases

```javascript
// snakeCase
import { DatePicker } from "antd";
// → import DatePicker from "antd/es/date_picker.js";

// PascalCase
import { DatePicker } from "antd";
// → import DatePicker from "antd/es/DatePicker.js";
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Build
pnpm build

# Watch build
pnpm dev
```

## Testing

This plugin includes comprehensive tests:

- 11 unit tests for transformation utilities
- 11 integration tests for the Babel plugin

All 22 tests pass ✅

## Comparison with SWC Plugin

If you're looking for better performance, consider using the SWC version:

- **[@shined/swc-plugin-transform-import-declaration](https://www.npmjs.com/package/@shined/swc-plugin-transform-import-declaration)** - Faster compilation with Rust/WebAssembly
- Same features and configuration
- Significantly better performance for large projects

## License

MIT

## Author

ityuany

## Related Packages

- **[@shined/swc-plugin-transform-import-declaration](https://www.npmjs.com/package/@shined/swc-plugin-transform-import-declaration)** - SWC version for better performance

## Issues & Contributions

Found a bug or want to contribute? Visit our [GitHub repository](https://github.com/ityuany/transform-import-declaration-plugin)
