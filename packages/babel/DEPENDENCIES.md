# 依赖说明

## 为什么选择 change-case

### 对比分析

在实现文件名转换功能时，我们对比了自定义实现和使用成熟开源库的方案：

| 维度 | 自定义实现 | change-case 库 |
|------|-----------|---------------|
| 代码量 | ~50 行 | ~5 行（仅导入和调用） |
| 维护成本 | 需要自己维护和修复 bug | 社区维护 |
| 边缘情况处理 | 可能遗漏 | 经过大量测试验证 |
| 功能完整性 | 基础功能 | 支持更多转换类型 |
| 包大小影响 | 0（内联代码） | 外部依赖 |
| 可靠性 | 需要充分测试 | 已被广泛使用 |

### change-case 库的优势

1. **成熟稳定**
   - 首次发布于 2013 年
   - 持续维护至今（2024年最新版本 5.4.4）
   - 被数千个项目使用

2. **功能完善**
   - 支持所有常见的命名转换
   - 处理了大量边缘情况
   - 支持 Unicode 字符

3. **TypeScript 支持**
   - 完整的类型定义
   - 类型安全的 API

4. **Tree-shakeable**
   - 可以按需导入
   - 不会增加不必要的包体积

5. **零依赖**
   - 各个转换函数都是独立的包
   - 没有额外的依赖负担

## 包信息

```json
{
  "name": "change-case",
  "version": "5.4.4",
  "description": "Transform a string between `camelCase`, `PascalCase`, `Capital Case`, `snake_case`, `kebab-case`, `CONSTANT_CASE` and others"
}
```

## 使用示例

```typescript
import { camelCase, pascalCase, snakeCase, kebabCase } from 'change-case';

camelCase('test string');      // => "testString"
pascalCase('test string');     // => "TestString"
snakeCase('test string');      // => "test_string"
kebabCase('test string');      // => "test-string"
```

## 我们的使用方式

```typescript
import { camelCase, pascalCase, snakeCase, kebabCase } from 'change-case';
import type { FilenameCase, TransformConfig } from './types';

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
```

## 依赖配置

在 `package.json` 中：

```json
{
  "dependencies": {
    "change-case": "^5.4.4"
  },
  "peerDependencies": {
    "@babel/core": "^7.0.0"
  }
}
```

在 `tsup.config.ts` 中标记为外部依赖：

```typescript
export default defineConfig({
  external: ['@babel/core', '@babel/types', 'change-case'],
  // ...
});
```

## 其他选择（仅供参考）

虽然我们选择了 `change-case`，但也有其他可选方案：

### 1. lodash
```typescript
import { camelCase, snakeCase, kebabCase } from 'lodash';
```
- ✅ 非常流行
- ❌ 包体积较大
- ❌ 功能过于全面（我们只需要命名转换）

### 2. voca
```typescript
import voca from 'voca';
```
- ✅ 字符串处理功能全面
- ❌ 包体积较大
- ❌ 更新不够频繁

### 3. just-kebab-case 等 just-* 系列
```typescript
import kebabCase from 'just-kebab-case';
import camelCase from 'just-camel-case';
```
- ✅ 包体积极小
- ❌ 需要安装多个包
- ❌ API 不统一

### 4. 自定义实现
```typescript
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}
```
- ✅ 零依赖
- ❌ 需要自己维护
- ❌ 可能遗漏边缘情况
- ❌ 增加代码复杂度

## 结论

选择 `change-case` 是最佳平衡：

- ✅ 成熟可靠
- ✅ 功能完善
- ✅ Tree-shakeable，不会显著增加包体积
- ✅ TypeScript 支持
- ✅ 社区维护
- ✅ API 简洁统一

对于我们的使用场景（4种命名转换），`change-case` 是最合适的选择。
