# Transform Import Declaration Plugin - 需求文档

## 项目概述

这是一个用于转换 JavaScript/TypeScript 模块导入声明的插件，主要用于将命名导入（named imports）转换为默认导入（default imports），并根据配置自动添加相关的样式文件导入。

## 核心功能

将类似 `import { Button, DatePicker } from "antd"` 的命名导入语句，转换为具体的路径导入，支持多种转换规则和配置选项。

---

## 详细需求说明

### 1. 基础转换（Example 1）

**场景：** 简单的命名导入转换为默认导入

**配置：**
```javascript
{
  filename: "kebabCase",        // 文件名转换规则：使用 kebab-case 命名
  source: "antd",               // 源模块名称
  output: ["antd/es/{{ filename }}.js"]  // 输出路径模板
}
```

**转换规则：**
- 输入：`import { Button } from "antd"`
- 输出：`import Button from "antd/es/button.js"`

**说明：**
- `{{ filename }}` 是模板变量，会被替换为转换后的文件名
- 文件名转换规则 `kebabCase` 会将 `Button` 转换为 `button`

---

### 2. 多文件导入（Example 2）

**场景：** 除了 JS 文件，还需要导入对应的样式文件

**配置：**
```javascript
{
  filename: "kebabCase",
  source: "antd",
  specifier: "default",  // 可省略，默认值
  output: [
    "antd/es/{{ filename }}.js",
    "antd/css/{{ filename }}.css"
  ]
}
```

**转换规则：**
- 输入：`import { Button } from "antd"`
- 输出：
  ```javascript
  import Button from "antd/es/button.js";
  import "antd/css/button.css";
  ```

**说明：**
- `output` 数组支持多个路径模板
- 第一个路径生成默认导入，后续路径生成副作用导入（side-effect imports）
- 样式文件使用副作用导入，不需要导入标识符
- `specifier: "default"` 生成默认导入语句

---

### 3. 排除特定组件（Example 3）

**场景：** 某些组件不需要转换，保持原样或完全排除

**配置：**
```javascript
{
  filename: "kebabCase",
  source: "antd",
  exclude: ["Button"],          // 排除列表
  output: [
    "antd/es/{{ filename }}.js",
    "antd/css/{{ filename }}.css"
  ]
}
```

**转换规则：**
- 输入：`import { Button, DatePicker } from "antd"`
- 输出：
  ```javascript
  import DatePicker from "antd/es/date-picker.js";
  import "antd/css/date-picker.css";
  ```

**说明：**
- `Button` 在 `exclude` 列表中，所以不会生成任何导入语句
- 只有 `DatePicker` 被转换
- `DatePicker` 按 kebab-case 规则转换为 `date-picker`

---

### 4. 多规则组合（Example 4）

**场景：** 不同的组件使用不同的转换规则

**配置：**
```javascript
[
  {
    filename: "kebabCase",
    source: "antd",
    exclude: ["Button"],
    output: [
      "antd/es/{{ filename }}.js",
      "antd/css/{{ filename }}.css"
    ]
  },
  {
    filename: "kebabCase",
    source: "antd",
    include: ["Button"],         // 包含列表
    output: [
      "antd/es/{{ filename }}.js",
      "antd/css/{{ filename }}.png"  // 注意：这里是 .png 文件
    ]
  }
]
```

**转换规则：**
- 输入：`import { Button, DatePicker } from "antd"`
- 输出：
  ```javascript
  import DatePicker from "antd/es/date-picker.js";
  import "antd/css/date-picker.css";
  import Button from "antd/es/button.js";
  import "antd/css/button.png";
  ```

**说明：**
- 配置是一个数组，按顺序匹配规则
- 第一个规则排除了 `Button`，所以 `DatePicker` 匹配并转换
- 第二个规则专门包含 `Button`，使用不同的资源文件扩展名（`.png`）
- 通过 `include` 和 `exclude` 可以实现精细化控制

---

## Example 5 - 导入说明符类型（specifier）

### 5.1 默认导入（default）

**配置：**
```javascript
{
  filename: "kebabCase",
  source: "antd",
  specifier: "default",  // 默认值
  output: ["antd/es/{{ filename }}.js"]
}
```

**转换规则：**
- 输入：`import { Button } from "antd"`
- 输出：`import Button from "antd/es/button.js"`

**说明：** 使用默认导入（default import），这是最常见的用法

---

### 5.2 命名导入（named）

**配置：**
```javascript
{
  filename: "kebabCase",
  source: "lodash",
  specifier: "named",
  output: ["lodash/{{ filename }}.js"]
}
```

**转换规则：**
- 输入：`import { debounce, throttle } from "lodash"`
- 输出：
  ```javascript
  import { debounce } from "lodash/debounce.js";
  import { throttle } from "lodash/throttle.js";
  ```

**说明：** 使用命名导入（named import），保持组件名作为命名导出

---

### 5.3 命名空间导入（namespace）

**配置：**
```javascript
{
  filename: "camelCase",
  source: "utils",
  specifier: "namespace",
  output: ["utils/{{ filename }}.js"]
}
```

**转换规则：**
- 输入：`import { DateUtils, StringUtils } from "utils"`
- 输出：
  ```javascript
  import * as DateUtils from "utils/dateUtils.js";
  import * as StringUtils from "utils/stringUtils.js";
  ```

**说明：** 使用命名空间导入（namespace import），将整个模块作为命名空间对象导入

---

### specifier 配置对比

| specifier 值 | 生成的导入语句格式 | 适用场景 |
|--------------|-------------------|---------|
| `default` | `import Button from "path"` | 模块使用 `export default` 导出 |
| `named` | `import { Button } from "path"` | 模块使用 `export { Button }` 导出 |
| `namespace` | `import * as Button from "path"` | 需要导入整个模块作为对象 |

---

## 配置项详解

### 必需配置项

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `source` | string | 要匹配的源模块名称，如 `"antd"` |
| `output` | string[] | 输出路径模板数组，第一个为默认导入，其余为副作用导入 |
| `filename` | "kebabCase" \| "camelCase" \| "snakeCase" \| "pascalCase" | 文件名转换规则 |

### 可选配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `specifier` | "default" \| "named" \| "namespace" | `"default"` | 导入说明符类型 |
| `include` | string[] | - | 只处理列表中的组件名称 |
| `exclude` | string[] | - | 排除列表中的组件名称 |

### 文件名转换规则

| 规则名称 | 示例转换 | 说明 |
|----------|----------|------|
| `kebabCase` | `Button` → `button`<br>`DatePicker` → `date-picker`<br>`MyComponent` → `my-component` | 小写字母，单词用连字符分隔 |
| `camelCase` | `Button` → `button`<br>`DatePicker` → `datePicker`<br>`MyComponent` → `myComponent` | 首字母小写，后续单词首字母大写 |
| `snakeCase` | `Button` → `button`<br>`DatePicker` → `date_picker`<br>`MyComponent` → `my_component` | 小写字母，单词用下划线分隔 |
| `pascalCase` | `Button` → `Button`<br>`DatePicker` → `DatePicker`<br>`MyComponent` → `MyComponent` | 每个单词首字母大写，保持原样 |

---

## 规则匹配优先级

1. 配置数组按顺序匹配
2. 同一个组件名只会被第一个匹配的规则处理
3. **`exclude` 优先级高于 `include`**（黑名单优先）
4. 如果既没有 `include` 也没有 `exclude`，则匹配所有组件

### 匹配逻辑

对于每个导入的组件：
```
FOR EACH 配置规则:
  // 第一优先级：检查 exclude（黑名单）
  IF 规则有 exclude AND 组件名 IN exclude:
    跳过此规则，继续下一个

  // 第二优先级：检查 include（白名单）
  IF 规则有 include:
    IF 组件名 IN include:
      应用此规则并跳出
    ELSE:
      跳过此规则，继续下一个

  // 没有任何过滤器
  ELSE:
    应用此规则并跳出
```

**重要：当同时配置 `include` 和 `exclude` 时，`exclude` 优先级更高。**

这意味着：
- 如果组件在 `exclude` 中，它会被直接拒绝，即使它也在 `include` 中
- 这样可以实现"处理 A、B、C，但不包括 B"的语义

---

## 技术实现要点

### 1. 模板变量替换

- `{{ filename }}` 需要替换为转换后的组件名
- 支持在路径的任意位置使用模板变量
- 文件扩展名保持不变

### 2. 导入语句生成

根据 `specifier` 配置生成不同的导入语句：

- **默认导入（default）：** 第一个 output 路径
  ```javascript
  import ComponentName from "path/to/component.js"
  ```

- **命名导入（named）：** 第一个 output 路径
  ```javascript
  import { ComponentName } from "path/to/component.js"
  ```

- **命名空间导入（namespace）：** 第一个 output 路径
  ```javascript
  import * as ComponentName from "path/to/component.js"
  ```

- **副作用导入：** 其余 output 路径（不受 specifier 影响）
  ```javascript
  import "path/to/style.css"
  ```

### 3. 源导入处理

- 转换后，原始的 `import { ... } from "antd"` 语句应该被移除或替换
- 如果所有命名导入都被转换，移除整个导入语句
- 如果只有部分被转换（因为 exclude），保留未转换的部分

---

## 使用场景

这个插件主要解决以下问题：

1. **Tree Shaking 优化：** 将整包导入拆分为单独的模块导入，减小打包体积
2. **按需加载：** 只导入使用到的组件及其样式
3. **构建性能：** 减少不必要的模块解析和打包
4. **灵活配置：** 不同组件可以有不同的导入策略

---

## 典型应用

### Ant Design 按需加载

```javascript
// 开发时写法（简洁）
import { Button, Table, Form } from 'antd';

// 自动转换为（优化后）
import Button from 'antd/es/button';
import 'antd/es/button/style';
import Table from 'antd/es/table';
import 'antd/es/table/style';
import Form from 'antd/es/form';
import 'antd/es/form/style';
```

### Element UI / Element Plus

```javascript
// 开发时
import { ElButton, ElTable } from 'element-plus';

// 转换为
import ElButton from 'element-plus/es/components/button';
import 'element-plus/es/components/button/style/css';
import ElTable from 'element-plus/es/components/table';
import 'element-plus/es/components/table/style/css';
```

---

## 扩展性考虑

### 未来可能的功能扩展

1. **更多命名转换规则：**
   - CONSTANT_CASE (全大写，下划线分隔)
   - dot.case (小写，点号分隔)
   - path/case (小写，斜杠分隔)

2. **条件转换：**
   - 基于文件路径的条件
   - 基于环境变量的条件

3. **自定义转换函数：**
   - 允许用户提供自定义的文件名转换逻辑

4. **智能匹配：**
   - 自动检测组件库结构
   - 自动生成配置建议

5. **TypeScript 类型导入处理：**
   - 区分类型导入和值导入
   - 保留必要的类型导入
