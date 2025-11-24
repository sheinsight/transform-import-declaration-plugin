# @shined/babel-plugin-transform-import-declaration

一个 Babel 插件,用于转换 JavaScript/TypeScript 模块导入声明,实现按需加载和 Tree Shaking,有效减小打包体积。

## 特性

- ✅ **按需加载** - 只导入使用到的组件,减小打包体积
- ✅ **样式自动导入** - 自动导入组件对应的样式文件
- ✅ **灵活的命名转换** - 支持 4 种文件名转换规则(kebab-case、camelCase、snake_case、PascalCase)
- ✅ **多种导入方式** - 支持 default、named、namespace 三种导入说明符
- ✅ **精细化控制** - 支持 include/exclude 过滤特定组件
- ✅ **多规则配置** - 同时配置多个转换规则
- ✅ **TypeScript 支持** - 完全支持 TypeScript,自动跳过类型导入

## 安装

```bash
npm install --save-dev @shined/babel-plugin-transform-import-declaration
# 或
pnpm add -D @shined/babel-plugin-transform-import-declaration
# 或
yarn add -D @shined/babel-plugin-transform-import-declaration
```

## 快速开始

### 基础配置

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

### 基础示例

**输入:**

```javascript
import { Button, DatePicker } from 'antd';
```

**输出:**

```javascript
import Button from 'antd/es/button/index.js';
import DatePicker from 'antd/es/date-picker/index.js';
```

## 配置选项

### TransformConfig

| 配置项 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `source` | `string` | 是 | - | 要转换的源模块名称 |
| `filename` | `FilenameCase` | 是 | - | 文件名转换规则 |
| `output` | `string[]` | 是 | - | 输出路径模板数组。**第一个元素生成主导入**(带标识符),**后续元素生成副作用导入**(如样式文件) |
| `specifier` | `SpecifierType` | 否 | `"default"` | 导入说明符类型 |
| `include` | `string[]` | 否 | - | 只处理指定的组件名称(白名单) |
| `exclude` | `string[]` | 否 | - | 排除指定的组件名称(黑名单) |

**注意:** `include` 和 `exclude` 互斥,不能同时使用。

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

**⚠️ 重要:** 数组顺序非常重要!第一个必须是组件路径,样式文件必须放在后面。

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
  "output": ["antd/es/{{ filename }}/index.js"],
  "exclude": ["Button"]
}

// 转换前
import { Button, DatePicker } from "antd";

// 转换后 👇
import { Button } from "antd";  // Button 被排除,保持原样
import DatePicker from "antd/es/date-picker/index.js";
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
{
  "config": [
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
}

// 转换前
import { Button, DatePicker } from "antd";

// 转换后 👇
import DatePicker from "antd/es/date-picker/index.js";
import "antd/es/date-picker/style/index.css";  // 使用第一个规则
import Button from "antd/es/button/index.js";
import "antd/es/button/style/index.less";      // 使用第二个规则
```

---

### Example 6 - 不同的导入说明符

#### 默认导入(default)

```javascript
// 配置
{
  "source": "antd",
  "filename": "kebabCase",
  "specifier": "default",
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
import { debounce } from "lodash";

// 转换后 👇
import { debounce } from "lodash/debounce.js";
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
import { DateUtils } from "utils";

// 转换后 👇
import * as DateUtils from "utils/dateUtils.js";
```

---

### Example 7 - 不同的文件名转换规则

```javascript
// kebabCase
{
  "filename": "kebabCase",
  "output": ["lib/{{ filename }}.js"]
}
// DatePicker → lib/date-picker.js

// camelCase
{
  "filename": "camelCase",
  "output": ["lib/{{ filename }}.js"]
}
// DatePicker → lib/datePicker.js

// snakeCase
{
  "filename": "snakeCase",
  "output": ["lib/{{ filename }}.js"]
}
// DatePicker → lib/date_picker.js

// pascalCase
{
  "filename": "pascalCase",
  "output": ["lib/{{ filename }}.js"]
}
// DatePicker → lib/DatePicker.js
```

---

## 实际应用场景

### Ant Design 按需加载

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

本插件完全支持 TypeScript,会自动跳过类型导入:

```typescript
// 这些不会被转换
import type { ButtonProps } from 'antd';
import { type InputProps, Button } from 'antd';

// 只有 Button 会被转换
```

---

## 常见问题

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

**✅ 正确配置:**
```json
{
  "output": [
    "antd/es/{{ filename }}/index.js",         // ✅ 组件在第一个
    "antd/es/{{ filename }}/style/index.css"   // ✅ 样式在后面
  ]
}
```

### Q: 可以同时使用 include 和 exclude 吗?

**A:** 不可以,`include` 和 `exclude` 是互斥的,只能使用其中一个。

### Q: 支持别名(alias)路径吗?

**A:** 支持。插件只关心 `source` 字段匹配,之后的路径转换由你的构建工具(Webpack/Rspack)的别名配置处理。

### Q: TypeScript 类型导入会被转换吗?

**A:** 不会。插件会自动识别并跳过类型导入(`import type` 或 `type` 关键字)。

---

## 为什么使用这个插件?

### 1. 减小打包体积

**不使用插件:**
```javascript
import { Button } from 'antd';  // 可能导入整个库(~2MB+)
```

**使用插件后:**
```javascript
import Button from 'antd/es/button/index.js';  // 只导入 Button(~50KB)
```

### 2. 提升构建性能

- 减少模块解析时间
- 减少打包处理的代码量
- 更好的 Tree Shaking 效果

### 3. 开发体验好

- 保持简洁的导入语法
- 自动处理样式导入
- 无需手动维护导入路径

---

## 开发

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 监听模式
pnpm test:watch

# 构建
pnpm build

# 开发模式
pnpm dev
```

## 测试

本插件包含完整的测试:

- 11 个转换工具单元测试
- 11 个 Babel 插件集成测试

所有 22 个测试全部通过 ✅

---

## 与 SWC 插件对比

如果你追求更高的性能,可以考虑使用 SWC 版本:

- **[@shined/swc-plugin-transform-import-declaration](https://www.npmjs.com/package/@shined/swc-plugin-transform-import-declaration)** - Rust 实现,性能更优
- 功能和配置完全相同
- 大型项目编译速度提升显著(20-70倍)

---

## 兼容性

- **Babel**: >= 7.0.0
- **Node.js**: >= 14.0.0

---

## 许可证

MIT

---

## 作者

ityuany

---

## 相关链接

- **NPM Package:** [@shined/babel-plugin-transform-import-declaration](https://www.npmjs.com/package/@shined/babel-plugin-transform-import-declaration)
- **SWC 版本:** [@shined/swc-plugin-transform-import-declaration](https://www.npmjs.com/package/@shined/swc-plugin-transform-import-declaration)
- **GitHub:** [transform-import-declaration-plugin](https://github.com/ityuany/transform-import-declaration-plugin)

---

## 贡献

欢迎提交 Issue 和 Pull Request!

如果这个项目对你有帮助,请给个 ⭐ Star 支持一下!
