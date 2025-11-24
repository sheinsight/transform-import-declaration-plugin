# Transform Import Declaration Plugin

一个用于转换 JavaScript/TypeScript 模块导入声明的插件,支持将命名导入转换为指定格式的导入语句,实现按需加载和 Tree Shaking,有效减小打包体积。

**提供两个版本:**
- 🔷 **Babel 插件** - TypeScript 实现,适用于 Babel 生态
- 🦀 **SWC 插件** - Rust 实现,更快的性能

## 特性

- ✅ **按需加载** - 只导入使用到的组件,减小打包体积
- ✅ **样式自动导入** - 自动导入组件对应的样式文件
- ✅ **灵活的命名转换** - 支持 4 种文件名转换规则(kebab-case、camelCase、snake_case、PascalCase)
- ✅ **多种导入方式** - 支持 default、named、namespace 三种导入说明符
- ✅ **精细化控制** - 支持 include/exclude 过滤特定组件
- ✅ **多规则配置** - 同时配置多个转换规则
- ✅ **高性能** - SWC 版本使用 Rust 编写,编译速度更快

## 快速开始

### 安装

#### 选择 Babel 插件

```bash
npm install @shined/babel-plugin-transform-import-declaration --save-dev
# 或
pnpm add -D @shined/babel-plugin-transform-import-declaration
# 或
yarn add -D @shined/babel-plugin-transform-import-declaration
```

#### 选择 SWC 插件

```bash
npm install @shined/swc-plugin-transform-import-declaration --save-dev
# 或
pnpm add -D @shined/swc-plugin-transform-import-declaration
# 或
yarn add -D @shined/swc-plugin-transform-import-declaration
```

### 配置

#### Babel 配置

在 `.babelrc` 或 `babel.config.js` 中配置:

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
            "output": ["antd/es/{{ filename }}/index.js"]
          }
        ]
      }
    ]
  ]
}
```

#### SWC 配置

在 `.swcrc` 中配置:

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

#### 在 Rspack/Webpack 中使用 SWC 插件

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
                          output: ['antd/es/{{ filename }}/index.js']
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

### 基础示例

**输入代码:**

```javascript
import { Button, DatePicker } from 'antd';
```

**转换后:**

```javascript
import Button from 'antd/es/button/index.js';
import DatePicker from 'antd/es/date-picker/index.js';
```

## 配置选项

### TransformConfig

| 配置项 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `source` | `string` | 是 | - | 要转换的源模块名称 |
| `filename` | `FilenameCase` | 否 | `"camelCase"` | 文件名转换规则 |
| `output` | `string[]` | 是 | - | 输出路径模板数组。**第一个元素生成主导入**(带标识符),**后续元素生成副作用导入**(如样式文件) |
| `specifier` | `SpecifierType` | 否 | `"default"` | 导入说明符类型 |
| `include` | `string[]` | 否 | - | 只处理指定的组件名称(白名单) |
| `exclude` | `string[]` | 否 | - | 排除指定的组件名称(黑名单) |

**注意:**
- `filename` 默认为 `camelCase`,如果不指定会将 `DatePicker` 转换为 `datePicker`
- `include` 和 `exclude` 互斥,不能同时使用

### Output - 输出路径规则

`output` 是一个字符串数组,用于定义生成的导入语句:

- **第一个元素(必需)**: 生成**主导入**语句,包含导入标识符
  ```javascript
  // output[0]: "antd/es/{{ filename }}/index.js"
  import Button from "antd/es/button/index.js";  // 带标识符 Button
  ```

- **后续元素(可选)**: 生成**副作用导入**语句,不包含标识符,通常用于导入样式文件
  ```javascript
  // output[1]: "antd/es/{{ filename }}/style/index.css"
  import "antd/es/button/style/index.css";  // 无标识符,仅导入副作用
  ```

**示例:**

```json
{
  "output": [
    "antd/es/{{ filename }}/index.js",       // 主导入
    "antd/es/{{ filename }}/style/index.css", // 副作用导入 1
    "antd/css/{{ filename }}.png"            // 副作用导入 2
  ]
}
```

转换结果:

```javascript
// 输入
import { Button } from "antd";

// 输出
import Button from "antd/es/button/index.js";        // 主导入
import "antd/es/button/style/index.css";             // 副作用导入 1
import "antd/css/button.png";                         // 副作用导入 2
```

### FilenameCase - 文件名转换规则

| 值 | 说明 | 转换示例 |
|-------|------|---------|
| `kebabCase` | 小写字母,用连字符分隔 | `Button` → `button`, `DatePicker` → `date-picker` |
| `camelCase` | 驼峰命名,首字母小写 | `Button` → `button`, `DatePicker` → `datePicker` |
| `snakeCase` | 小写字母,用下划线分隔 | `Button` → `button`, `DatePicker` → `date_picker` |
| `pascalCase` | 帕斯卡命名,首字母大写 | `Button` → `Button`, `DatePicker` → `DatePicker` |

### SpecifierType - 导入说明符类型

| 值 | 生成的导入语句 | 使用场景 |
|-------|------------------|----------|
| `default` | `import Button from "path"` | 模块使用 `export default` 导出 |
| `named` | `import { Button } from "path"` | 模块使用 `export { Button }` 导出 |
| `namespace` | `import * as Button from "path"` | 导入整个模块作为对象 |

## 使用示例

### Example 1 - 基础转换

最简单的用法,将命名导入转换为默认导入。

```javascript
// 配置
{
  "source": "antd",
  "filename": "kebabCase",
  "output": ["antd/es/{{ filename }}/index.js"]
}

// 转换前
import { Button } from "antd";

// 转换后 👇
import Button from "antd/es/button/index.js";
```

---

### Example 2 - 导入样式文件

除了组件,还可以自动导入对应的样式文件。

```javascript
// 配置
{
  "source": "antd",
  "filename": "kebabCase",
  "output": [
    "antd/es/{{ filename }}/index.js",
    "antd/es/{{ filename }}/style/index.css"
  ]
}

// 转换前
import { Button } from "antd";

// 转换后 👇
import Button from "antd/es/button/index.js";
import "antd/es/button/style/index.css";
```

---

### Example 3 - 排除特定组件

使用 `exclude` 排除不需要转换的组件。

```javascript
// 配置
{
  "source": "antd",
  "filename": "kebabCase",
  "output": [
    "antd/es/{{ filename }}/index.js",
    "antd/es/{{ filename }}/style/index.css"
  ],
  "exclude": ["Button"]
}

// 转换前
import { Button, DatePicker } from "antd";

// 转换后 👇
import { Button } from "antd";  // Button 被排除,保持原样
import DatePicker from "antd/es/date-picker/index.js";
import "antd/es/date-picker/style/index.css";
```

---

### Example 4 - 只处理指定组件

使用 `include` 只处理指定的组件。

```javascript
// 配置
{
  "source": "antd",
  "filename": "kebabCase",
  "output": ["antd/es/{{ filename }}/index.js"],
  "include": ["Button", "Input"]
}

// 转换前
import { Button, DatePicker, Input } from "antd";

// 转换后 👇
import Button from "antd/es/button/index.js";
import Input from "antd/es/input/index.js";
import { DatePicker } from "antd";  // DatePicker 不在 include 中,保持原样
```

---

### Example 5 - 多规则配置

不同的组件可以使用不同的转换规则。

```javascript
// 配置
[
  {
    "source": "antd",
    "filename": "kebabCase",
    "output": [
      "antd/es/{{ filename }}/index.js",
      "antd/es/{{ filename }}/style/index.css"
    ],
    "exclude": ["Button"]
  },
  {
    "source": "antd",
    "filename": "kebabCase",
    "output": [
      "antd/es/{{ filename }}/index.js",
      "antd/es/{{ filename }}/style/index.less"
    ],
    "include": ["Button"]
  }
]

// 转换前
import { Button, DatePicker } from "antd";

// 转换后 👇
import DatePicker from "antd/es/date-picker/index.js";
import "antd/es/date-picker/style/index.css";  // 使用第一个规则,导入 CSS
import Button from "antd/es/button/index.js";
import "antd/es/button/style/index.less";      // 使用第二个规则,导入 LESS
```

---

### Example 6 - 不同的导入说明符

使用 `specifier` 配置生成不同类型的导入语句。

#### 默认导入(default)

```javascript
// 配置
{
  "source": "antd",
  "filename": "kebabCase",
  "specifier": "default",  // 默认值,可省略
  "output": ["antd/es/{{ filename }}/index.js"]
}

// 转换前
import { Button } from "antd";

// 转换后 👇
import Button from "antd/es/button/index.js";
```

#### 命名导入(named)

```javascript
// 配置
{
  "source": "lodash",
  "filename": "kebabCase",
  "specifier": "named",
  "output": ["lodash/{{ filename }}.js"]
}

// 转换前
import { debounce, throttle } from "lodash";

// 转换后 👇
import { debounce } from "lodash/debounce.js";
import { throttle } from "lodash/throttle.js";
```

#### 命名空间导入(namespace)

```javascript
// 配置
{
  "source": "utils",
  "filename": "camelCase",
  "specifier": "namespace",
  "output": ["utils/{{ filename }}.js"]
}

// 转换前
import { DateUtils, StringUtils } from "utils";

// 转换后 👇
import * as DateUtils from "utils/dateUtils.js";
import * as StringUtils from "utils/stringUtils.js";
```

---

### Example 7 - 不同的文件名转换规则

```javascript
// kebabCase - 推荐用于大多数情况
{
  "filename": "kebabCase",
  "output": ["lib/{{ filename }}.js"]
}
// DatePicker → lib/date-picker.js

// camelCase - 适用于驼峰命名的文件系统
{
  "filename": "camelCase",
  "output": ["lib/{{ filename }}.js"]
}
// DatePicker → lib/datePicker.js

// snakeCase - 适用于使用下划线的项目
{
  "filename": "snakeCase",
  "output": ["lib/{{ filename }}.js"]
}
// DatePicker → lib/date_picker.js

// pascalCase - 保持原始大小写
{
  "filename": "pascalCase",
  "output": ["lib/{{ filename }}.js"]
}
// DatePicker → lib/DatePicker.js
```

---

## 实际应用场景

### Ant Design 按需加载

**Babel 配置:**

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
            "output": [
              "antd/es/{{ filename }}/index.js",
              "antd/es/{{ filename }}/style/index.css"
            ]
          }
        ]
      }
    ]
  ]
}
```

**SWC 配置:**

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
                "output": [
                  "antd/es/{{ filename }}/index.js",
                  "antd/es/{{ filename }}/style/index.css"
                ]
              }
            ]
          }
        ]
      ]
    }
  }
}
```

**效果:**

```javascript
// 开发时写法
import { Button, Table, Form } from 'antd';

// 自动转换为
import Button from 'antd/es/button/index.js';
import 'antd/es/button/style/index.css';
import Table from 'antd/es/table/index.js';
import 'antd/es/table/style/index.css';
import Form from 'antd/es/form/index.js';
import 'antd/es/form/style/index.css';
```

---

### Lodash 按需导入

**配置(两种插件相同):**

```json
{
  "source": "lodash",
  "filename": "camelCase",
  "specifier": "default",
  "output": ["lodash/{{ filename }}.js"]
}
```

**效果:**

```javascript
// 开发时写法
import { debounce, throttle, cloneDeep } from 'lodash';

// 自动转换为
import debounce from 'lodash/debounce.js';
import throttle from 'lodash/throttle.js';
import cloneDeep from 'lodash/cloneDeep.js';
```

---

### Element Plus 按需加载

**配置(两种插件相同):**

```json
{
  "source": "element-plus",
  "filename": "kebabCase",
  "output": [
    "element-plus/es/components/{{ filename }}/index.js",
    "element-plus/es/components/{{ filename }}/style/index.css"
  ]
}
```

**效果:**

```javascript
// 开发时写法
import { ElButton, ElTable } from 'element-plus';

// 自动转换为
import ElButton from 'element-plus/es/components/el-button/index.js';
import 'element-plus/es/components/el-button/style/index.css';
import ElTable from 'element-plus/es/components/el-table/index.js';
import 'element-plus/es/components/el-table/style/index.css';
```

---

## TypeScript 支持

两个插件都完全支持 TypeScript,会自动跳过类型导入:

```typescript
// 这些不会被转换
import type { ButtonProps } from 'antd';
import { type InputProps, Button } from 'antd';

// 只有 Button 会被转换
```

---

## Babel 插件 vs SWC 插件

### 功能对比

| 特性 | Babel 插件 | SWC 插件 |
|------|-----------|----------|
| 配置格式 | ✅ 完全相同 | ✅ 完全相同 |
| 转换规则 | ✅ 完全相同 | ✅ 完全相同 |
| TypeScript 支持 | ✅ | ✅ |
| 实现语言 | TypeScript | Rust |
| 编译速度 | 较慢 | ⚡ 极快 |
| 适用场景 | 现有 Babel 项目 | 新项目或性能敏感项目 |
| 生态系统 | Babel | SWC/Rspack/Webpack |

### 如何选择?

**选择 Babel 插件如果:**
- 项目已经使用 Babel
- 需要与其他 Babel 插件配合使用
- 项目规模较小,构建速度不是瓶颈

**选择 SWC 插件如果:**
- 追求极致的编译性能
- 使用 Rspack、Webpack 或原生 SWC
- 项目规模较大,需要优化构建时间
- 正在启动新项目

---

## 为什么使用这个插件?

### 1. 减小打包体积

**不使用插件时:**

```javascript
import { Button } from 'antd';  // 导入整个 antd 库
```

打包后可能包含所有组件代码(~2MB+)

**使用插件后:**

```javascript
import Button from 'antd/es/button';  // 只导入 Button 组件
```

打包后只包含 Button 相关代码(~50KB)

### 2. 提升构建性能

- 减少模块解析时间
- 减少打包处理的代码量
- 更好的 Tree Shaking 效果

### 3. 开发体验好

- 保持简洁的导入语法
- 自动处理样式导入
- 无需手动维护导入路径

### 4. 灵活配置

- 支持多种命名转换规则
- 支持多种导入方式
- 精细化的组件过滤

---

## 常见问题

### Q: output 数组可以为空吗?

**A:** ⚠️ **不可以!** `output` 数组**必须至少包含一个元素**,否则插件会在启动时抛出错误。

**❌ 错误配置:**
```json
{
  "source": "antd",
  "filename": "kebabCase",
  "output": []  // ❌ 空数组会导致错误!
}
```

**错误信息:**
```
Config #0 (source: 'antd'): 'output' must be a non-empty array.
The 'output' array defines the import paths to generate:
- First element: main import (with identifier)
- Remaining elements: side-effect imports (e.g., styles)
```

**✅ 正确配置:**
```json
{
  "source": "antd",
  "filename": "kebabCase",
  "output": ["antd/es/{{ filename }}/index.js"]  // ✅ 至少一个元素
}
```

### Q: output 数组的顺序有什么要求?

**A:** ⚠️ **非常重要!** `output` 数组的顺序决定了生成的导入类型:

- **第一个元素** = 主导入(带标识符)
- **后续元素** = 副作用导入(无标识符)

**❌ 错误配置:**
```json
{
  "output": [
    "antd/es/{{ filename }}/style/index.css",  // ❌ 样式不应该在第一个!
    "antd/es/{{ filename }}/index.js"
  ]
}
```

这会生成:
```javascript
import Button from "antd/es/button/style/index.css";  // ❌ 错误!导入了样式文件
import "antd/es/button/index.js";                     // ❌ 组件变成了副作用导入
```

**✅ 正确配置:**
```json
{
  "output": [
    "antd/es/{{ filename }}/index.js",         // ✅ 组件在第一个
    "antd/es/{{ filename }}/style/index.css"   // ✅ 样式在后面
  ]
}
```

这会生成:
```javascript
import Button from "antd/es/button/index.js";       // ✅ 正确!
import "antd/es/button/style/index.css";            // ✅ 正确!
```

### Q: Babel 和 SWC 插件的配置格式是否相同?

**A:** 是的,完全相同。你可以直接复制配置,在两种插件之间切换。

### Q: 可以同时使用 include 和 exclude 吗?

**A:** 不可以,`include` 和 `exclude` 是互斥的,只能使用其中一个。

### Q: 如何处理样式导入?

**A:** 在 `output` 数组中添加多个路径模板,第一个是组件路径,后续的会生成副作用导入(样式):

```json
{
  "output": [
    "antd/es/{{ filename }}/index.js",         // 主导入
    "antd/es/{{ filename }}/style/index.css"   // 样式导入
  ]
}
```

### Q: 支持别名(alias)路径吗?

**A:** 支持。插件只关心 `source` 字段匹配,之后的路径转换由你的构建工具(Webpack/Rspack)的别名配置处理。

### Q: TypeScript 类型导入会被转换吗?

**A:** 不会。插件会自动识别并跳过类型导入(`import type` 或 `type` 关键字)。

### Q: 性能差异有多大?

**A:** 在大型项目中,SWC 插件的编译速度可以比 Babel 插件快 20-70 倍,具体取决于项目规模。

---

## 开发者文档

如果你想为这个项目贡献代码,请参考:

- [MONOREPO.md](./MONOREPO.md) - Monorepo 项目结构和开发指南
- [packages/babel/README.md](./packages/babel/README.md) - Babel 插件详细文档
- [packages/swc/README.md](./packages/swc/README.md) - SWC 插件详细文档
- [E2E-TESTING.md](./E2E-TESTING.md) - E2E 测试文档

### 项目结构

这是一个 **pnpm monorepo** 项目:

```
transform-import-declaration-plugin/
├── packages/
│   ├── babel/          # Babel 插件 (TypeScript)
│   └── swc/            # SWC 插件 (Rust)
├── e2e-tests/          # 统一的 E2E 测试
└── MONOREPO.md         # Monorepo 使用文档
```

### 快速开始

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行 E2E 测试
pnpm test:e2e

# 只测试 Babel
pnpm test:babel

# 只测试 SWC
pnpm test:swc

# 开发模式(监听文件变化)
pnpm dev

# 清理构建产物
pnpm clean
```

### 测试状态

- ✅ Babel 单元测试: 22/22 通过
- ✅ SWC 单元测试: 20/20 通过
- ✅ E2E 测试(Babel): 29/29 通过
- ⏳ E2E 测试(SWC): 待编译 WASM

---

## 兼容性

### Babel 插件

- **Babel**: >= 7.0.0
- **Node.js**: >= 14.0.0

### SWC 插件

- **SWC**: Core library
- **Node.js**: >= 14.0.0
- **Rspack**: 兼容 rspack 的 SWC loader
- **Webpack**: 兼容 swc-loader

---

## 许可证

MIT

---

## 作者

ityuany

---

## 相关链接

- **NPM Packages:**
  - [@shined/babel-plugin-transform-import-declaration](https://www.npmjs.com/package/@shined/babel-plugin-transform-import-declaration)
  - [@shined/swc-plugin-transform-import-declaration](https://www.npmjs.com/package/@shined/swc-plugin-transform-import-declaration)

- **GitHub Repository:** [transform-import-declaration-plugin](https://github.com/ityuany/transform-import-declaration-plugin)

---

## 贡献

欢迎提交 Issue 和 Pull Request!

如果这个项目对你有帮助,请给个 ⭐ Star 支持一下!
