# Babel Plugin Implementation - 实现总结

## 项目概述

成功实现了完整的 Babel 版本的导入声明转换插件，使用 TypeScript 编写，支持将命名导入转换为不同类型的导入语句，并自动添加样式文件导入。

## 实现的功能

### 1. 文件名转换规则（4种）

- **kebabCase**: `Button` → `button`, `DatePicker` → `date-picker`
- **camelCase**: `Button` → `button`, `DatePicker` → `datePicker`
- **snakeCase**: `Button` → `button`, `DatePicker` → `date_picker`
- **pascalCase**: `Button` → `Button`, `DatePicker` → `DatePicker`

### 2. 导入说明符类型（3种）

- **default**: `import Button from "path"` - 默认导入
- **named**: `import { Button } from "path"` - 命名导入
- **namespace**: `import * as Button from "path"` - 命名空间导入

### 3. 配置匹配逻辑

- **include**: 只处理指定的组件名称（白名单）
- **exclude**: 排除指定的组件名称（黑名单）
- **互斥规则**: **`include` 和 `exclude` 不能同时配置** ⚠️
  - 同时配置会在启动时报错
  - 这样避免了配置歧义和理解成本
- **多规则支持**: 对每个组件按顺序尝试所有配置，使用第一个匹配的配置

### 4. 核心转换功能

- 支持模板变量 `{{ filename }}`
- 第一个 output 生成主导入（根据 specifier 类型）
- 后续 output 生成副作用导入
- 保留未处理的导入说明符

## 代码结构

```
packages/babel/
├── package.json           # 包配置
├── tsconfig.json          # TypeScript 配置
├── vitest.config.ts       # Vitest 测试配置
├── tsup.config.ts         # Tsup 构建配置
├── lecp.config.ts         # Lecp 构建配置（备用）
├── src/
│   ├── types.ts           # 类型定义
│   ├── transform.ts       # 核心转换逻辑
│   ├── index.ts           # Babel 插件入口
│   └── __tests__/
│       ├── transform.test.ts  # 单元测试
│       └── plugin.test.ts     # 集成测试
├── dist/                  # 构建输出
│   ├── index.js           # CommonJS 格式
│   ├── index.mjs          # ES Module 格式
│   └── index.d.ts         # TypeScript 类型定义
└── README.md              # 使用文档
```

## 技术栈

- **语言**: TypeScript 5.9.3
- **构建工具**: Tsup 8.5.1（主要）+ Lecp 0.1.1（备用）
- **测试框架**: Vitest 4.0.12
- **依赖**:
  - @babel/core ^7.28.5
  - @babel/types ^7.28.5
  - change-case ^5.4.4（命名转换库）

## 测试覆盖

### 单元测试（11个）

**transform.test.ts**:

1. `should convert to kebab-case`
2. `should convert to camelCase`
3. `should convert to snake_case`
4. `should keep PascalCase`
5. `should match when include contains the name`
6. `should not match when exclude contains the name`
7. `should match all when no filters are set`
8. `should throw error when both include and exclude are configured`
9. `should not throw when only include is configured`
10. `should not throw when only exclude is configured`
11. `should not throw when neither include nor exclude is configured`

### 集成测试（11个）

**plugin.test.ts**:

1. `should transform basic named import to default import`
2. `should transform multiple named imports`
3. `should generate side-effect imports for styles`
4. `should exclude specified components`
5. `should handle multiple configs`
6. `should support named specifier`
7. `should support namespace specifier`
8. `should support snake_case filename`
9. `should support PascalCase filename`
10. `should preserve non-named imports`
11. `should throw error when both include and exclude are configured`

**所有 22 个测试全部通过！ ✅**

## 核心实现细节

### 类型定义 (types.ts)

```typescript
export type FilenameCase = 'kebabCase' | 'camelCase' | 'snakeCase' | 'pascalCase';
export type SpecifierType = 'default' | 'named' | 'namespace';

export interface TransformConfig {
  source: string;
  filename: FilenameCase;
  output: string[];
  specifier?: SpecifierType;
  include?: string[];
  exclude?: string[];
}

export interface PluginConfig {
  config: TransformConfig[];
}
```

### 转换工具 (transform.ts)

```typescript
// 使用 change-case 库进行文件名转换
import { camelCase, pascalCase, snakeCase, kebabCase } from 'change-case';

export function transformFilename(name: string, caseType: FilenameCase): string {
  switch (caseType) {
    case 'kebabCase':
      return kebabCase(name);
    case 'camelCase':
      return camelCase(name);
    case 'snakeCase':
      return snakeCase(name);
    case 'pascalCase':
      return pascalCase(name);
  }
}

// 配置匹配函数
export function configMatches(config: TransformConfig, name: string): boolean {
  if (config.include) {
    return config.include.includes(name);
  }
  if (config.exclude) {
    return !config.exclude.includes(name);
  }
  return true;
}

// 配置验证函数
export function validateConfig(configs: TransformConfig[]): void {
  configs.forEach((config, index) => {
    if (config.include && config.exclude) {
      throw new Error(
        `配置 #${index} (source: '${config.source}'): include 和 exclude 不能同时配置。`
      );
    }
  });
}
```

**注意**：我们使用 [change-case](https://github.com/blakeembrey/change-case) 库来处理命名转换，这是一个成熟稳定的开源库，相比自定义实现：
- ✅ 经过充分测试，处理了各种边缘情况
- ✅ 支持 Unicode 字符
- ✅ 社区维护，无需自己维护转换逻辑
- ✅ TypeScript 支持
- ✅ Tree-shakeable，不会显著增加包体积

详见 [DEPENDENCIES.md](./DEPENDENCIES.md) 了解选择理由。

### Babel 插件 (index.ts)

关键实现：

1. **配置验证**：在 `Program` visitor 的 `enter` 阶段验证配置
2. **导入转换**：在 `ImportDeclaration` visitor 中处理导入语句
3. **AST 节点创建**：使用 `@babel/types` 创建新的导入声明

```typescript
import * as t from '@babel/types';

// 创建不同类型的导入
switch (specifierType) {
  case 'default':
    t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier(localName))],
      t.stringLiteral(mainPath)
    );
    break;

  case 'named':
    t.importDeclaration(
      [t.importSpecifier(
        t.identifier(localName),
        t.identifier(importedName)
      )],
      t.stringLiteral(mainPath)
    );
    break;

  case 'namespace':
    t.importDeclaration(
      [t.importNamespaceSpecifier(t.identifier(localName))],
      t.stringLiteral(mainPath)
    );
    break;
}

// 副作用导入
t.importDeclaration([], t.stringLiteral(stylePath));
```

## 构建配置

### Tsup 配置 (推荐)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  outDir: 'dist',
  external: ['@babel/core', '@babel/types'],
  splitting: false,
});
```

### Lecp 配置 (备用)

```typescript
import { defineConfig } from '@shined/lecp';

export default defineConfig({
  entries: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    bundle: true,
  },
  clean: true,
  sourcemap: false,
  outDir: 'dist',
  external: ['@babel/core', '@babel/types'],
  bundle: true,
});
```

**注意**：由于 Lecp 在当前配置下只生成类型定义文件，我们主要使用 Tsup 作为构建工具。Lecp 配置保留供将来参考。

## 使用示例

### 基础用法

```javascript
// .babelrc
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

// Input
import { Button, DatePicker } from 'antd';

// Output
import Button from 'antd/es/button.js';
import DatePicker from 'antd/es/date-picker.js';
```

### 带样式导入

```javascript
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

// Output
import Button from 'antd/es/button.js';
import 'antd/es/button/style/css';
```

## 与 SWC 版本的对比

| 特性 | SWC 版本 | Babel 版本 |
|------|----------|-----------|
| 语言 | Rust | TypeScript |
| 性能 | 更快 | 较慢 |
| 生态 | Rust 生态 | Node.js 生态 |
| 构建工具 | Cargo | Tsup/Lecp |
| 测试框架 | Rust test | Vitest |
| AST 操作 | swc_core::ecma | @babel/types |
| 插件系统 | SWC plugin | Babel plugin |
| 文件大小 | 编译后二进制 | JS/MJS |
| 开发体验 | 需要编译 | 直接运行 |
| 类型安全 | Rust 类型系统 | TypeScript |

## 优势

### ✅ 开发体验

- **TypeScript**: 完整的类型提示和检查
- **热更新**: 开发时快速重新加载
- **调试**: 可以直接使用 Chrome DevTools
- **易于贡献**: JavaScript/TypeScript 开发者更容易参与

### ✅ 生态系统

- **Babel 生态**: 可以与其他 Babel 插件无缝集成
- **工具链**: 丰富的 JavaScript 工具链支持
- **文档**: 大量 Babel 插件开发资源

### ✅ 测试

- **Vitest**: 现代化的测试框架
- **快速反馈**: 测试运行快速
- **Coverage**: 容易生成测试覆盖率报告

## 注意事项

1. **性能**: Babel 版本性能不如 SWC 版本，但对于大多数项目足够快
2. **构建工具**: 推荐使用 Tsup，Lecp 当前版本有限制
3. **依赖管理**: 确保 `@babel/core` 版本兼容
4. **配置验证**: 在程序开始时验证配置，提早发现错误

## 未来改进建议

1. **性能优化**:
   - 缓存转换结果
   - 优化 AST 遍历

2. **功能扩展**:
   - 支持更多命名转换规则
   - 支持正则表达式匹配
   - 支持条件转换

3. **开发体验**:
   - 添加 VS Code 插件
   - 提供配置生成器
   - 改进错误消息

4. **测试**:
   - 添加性能基准测试
   - 添加更多边缘案例
   - 集成测试覆盖率工具

## 结论

成功实现了完整的 Babel 插件，满足所有需求文档中描述的功能：

✅ 支持 4 种文件名转换规则
✅ 支持 3 种导入说明符类型
✅ 支持 include/exclude 过滤（互斥）
✅ 支持多规则配置
✅ 支持模板变量替换
✅ 支持副作用导入
✅ 所有 22 个测试全部通过
✅ TypeScript 编写，类型安全
✅ 使用 Tsup 构建，输出 CJS + ESM
✅ 完整的文档和示例

插件已准备好用于生产环境！🎉
