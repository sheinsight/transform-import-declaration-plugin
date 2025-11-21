# Transform Import Declaration Plugin

一个用于转换 JavaScript/TypeScript 模块导入声明的插件，支持将命名导入转换为指定格式的导入语句，并自动添加相关的样式文件导入。

**提供两个版本：**
- 🔷 **Babel 插件** - TypeScript 实现，适用于 Babel 生态
- 🦀 **SWC 插件** - Rust 实现，更快的性能

## 项目结构

这是一个 **pnpm monorepo** 项目：

```
transform-import-declaration-plugin/
├── packages/
│   ├── babel/          # Babel 插件 (TypeScript)
│   └── swc/            # SWC 插件 (Rust)
├── e2e-tests/          # 统一的 E2E 测试
└── MONOREPO.md         # Monorepo 使用文档
```

## 快速开始

### 开发者

```bash
# 安装依赖
pnpm install

# 运行所有测试
pnpm test

# 构建所有包
pnpm build
```

详见 [MONOREPO.md](./MONOREPO.md)

### 用户

#### Babel 插件

```bash
npm install @shined/babel-plugin-transform-import-declaration --save-dev
```

详见 [packages/babel/README.md](./packages/babel/README.md)

#### SWC 插件

详见 [packages/swc/README.md](./packages/swc/README.md)

## 测试

```bash
# 运行所有测试（单元测试 + E2E 测试）
pnpm test

# 只运行单元测试
pnpm test:unit

# 只运行 E2E 测试
pnpm test:e2e
```

**测试结果**：
- ✅ Babel 单元测试：22/22 通过
- ✅ SWC 单元测试：20/20 通过
- ✅ E2E 测试（Babel）：29/29 通过
- ⏳ E2E 测试（SWC）：待编译 WASM

详见 [E2E-TESTING.md](./E2E-TESTING.md)

## 统一命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装所有依赖 |
| `pnpm build` | 构建所有包 |
| `pnpm test` | 运行所有测试 |
| `pnpm test:unit` | 运行单元测试 |
| `pnpm test:e2e` | 运行 E2E 测试 |
| `pnpm test:babel` | 只测试 Babel 版本 |
| `pnpm test:swc` | 只测试 SWC 版本 |
| `pnpm dev` | 所有包进入开发模式 |
| `pnpm clean` | 清理所有构建产物 |

## 功能示例

## 配置选项

### 必需配置

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `source` | `string` | 源模块名称，如 `"antd"` |
| `filename` | `"kebabCase"` \| `"camelCase"` \| `"snakeCase"` \| `"pascalCase"` | 文件名转换规则 |
| `output` | `string[]` | 输出路径模板数组，第一个为主导入，其余为副作用导入 |

### 可选配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `specifier` | `"default"` \| `"named"` \| `"namespace"` | `"default"` | 导入说明符类型 |
| `include` | `string[]` | - | 只处理指定的组件名称 |
| `exclude` | `string[]` | - | 排除指定的组件名称 |

### 文件名转换规则

| 规则 | 示例 |
|------|------|
| `kebabCase` | `Button` → `button`，`DatePicker` → `date-picker` |
| `camelCase` | `Button` → `button`，`DatePicker` → `datePicker` |
| `snakeCase` | `Button` → `button`，`DatePicker` → `date_picker` |
| `pascalCase` | `Button` → `Button`，`DatePicker` → `DatePicker` |

---

## 使用示例

### Example 1 - 基础转换

最简单的用法，将命名导入转换为默认导入。

```js
// config.js
let config = [{
  filename: "kebabCase",
  source: "antd",
  output: ["antd/es/{{ filename }}.js"],
}]

// 转换前
import { Button } from "antd";

// 转换后 👇
import Button from "antd/es/button.js";
```

---

### Example 2 - 导入样式文件

除了组件，还可以自动导入对应的样式文件。

```js
// config.js
let config = [{
  filename: "kebabCase",
  source: "antd",
  output: ["antd/es/{{ filename }}.js", "antd/css/{{ filename }}.css"],
}]

// 转换前
import { Button } from "antd";

// 转换后 👇
import Button from "antd/es/button.js";
import "antd/css/button.css";
```

---

### Example 3 - 排除特定组件

使用 `exclude` 排除不需要转换的组件。

```js
// config.js
let config = [{
  filename: "kebabCase",
  source: "antd",
  exclude: ["Button"],
  output: ["antd/es/{{ filename }}.js", "antd/css/{{ filename }}.css"],
}]

// 转换前
import { Button, DatePicker } from "antd";

// 转换后 👇
// Button 被排除，不会生成导入语句
import DatePicker from "antd/es/date-picker.js";
import "antd/css/date-picker.css";
```

---

### Example 4 - 多规则配置

不同的组件可以使用不同的转换规则。

```js
// config.js
let config = [
  {
    filename: "kebabCase",
    source: "antd",
    exclude: ["Button"],
    output: ["antd/es/{{ filename }}.js", "antd/css/{{ filename }}.css"],
  },
  {
    filename: "kebabCase",
    source: "antd",
    include: ["Button"],
    output: ["antd/es/{{ filename }}.js", "antd/css/{{ filename }}.png"],
  },
]

// 转换前
import { Button, DatePicker } from "antd";

// 转换后 👇
import DatePicker from "antd/es/date-picker.js";
import "antd/css/date-picker.css";
import Button from "antd/es/button.js";
import "antd/css/button.png";
```

---

### Example 5 - 不同的导入说明符

使用 `specifier` 配置生成不同类型的导入语句。

#### 默认导入（default）

```js
// config.js
let config = [{
  filename: "kebabCase",
  source: "antd",
  specifier: "default", // 默认值，可省略
  output: ["antd/es/{{ filename }}.js"],
}]

// 转换前
import { Button } from "antd";

// 转换后 👇
import Button from "antd/es/button.js";
```

#### 命名导入（named）

```js
// config.js
let config = [{
  filename: "kebabCase",
  source: "lodash",
  specifier: "named",
  output: ["lodash/{{ filename }}.js"],
}]

// 转换前
import { debounce, throttle } from "lodash";

// 转换后 👇
import { debounce } from "lodash/debounce.js";
import { throttle } from "lodash/throttle.js";
```

#### 命名空间导入（namespace）

```js
// config.js
let config = [{
  filename: "camelCase",
  source: "utils",
  specifier: "namespace",
  output: ["utils/{{ filename }}.js"],
}]

// 转换前
import { DateUtils, StringUtils } from "utils";

// 转换后 👇
import * as DateUtils from "utils/dateUtils.js";
import * as StringUtils from "utils/stringUtils.js";
```

---

## 实际应用场景

### Ant Design 按需加载

```javascript
// 配置
{
  source: "antd",
  filename: "kebabCase",
  output: [
    "antd/es/{{ filename }}",
    "antd/es/{{ filename }}/style/css"
  ]
}

// 开发时写法
import { Button, Table, Form } from 'antd';

// 自动转换为
import Button from 'antd/es/button';
import 'antd/es/button/style/css';
import Table from 'antd/es/table';
import 'antd/es/table/style/css';
import Form from 'antd/es/form';
import 'antd/es/form/style/css';
```

### Lodash 按需导入

```javascript
// 配置
{
  source: "lodash",
  filename: "camelCase",
  specifier: "default",
  output: ["lodash/{{ filename }}"]
}

// 开发时写法
import { debounce, throttle, cloneDeep } from 'lodash';

// 自动转换为
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import cloneDeep from 'lodash/cloneDeep';
```

### Element Plus 按需加载

```javascript
// 配置
{
  source: "element-plus",
  filename: "kebabCase",
  output: [
    "element-plus/es/components/{{ filename }}",
    "element-plus/es/components/{{ filename }}/style/css"
  ]
}

// 开发时写法
import { ElButton, ElTable } from 'element-plus';

// 自动转换为
import ElButton from 'element-plus/es/components/el-button';
import 'element-plus/es/components/el-button/style/css';
import ElTable from 'element-plus/es/components/el-table';
import 'element-plus/es/components/el-table/style/css';
```

---

## 为什么使用这个插件？

1. **减小打包体积** - 只导入使用到的组件，Tree Shaking 更有效
2. **提升构建性能** - 减少不必要的模块解析和打包
3. **开发体验好** - 保持简洁的导入语法，自动转换为优化后的代码
4. **灵活配置** - 支持多种转换规则和导入方式

---

## 许可证

MIT

---

## 更多信息

查看 [REQUIREMENTS.md](./REQUIREMENTS.md) 了解详细的需求文档和技术实现细节。
