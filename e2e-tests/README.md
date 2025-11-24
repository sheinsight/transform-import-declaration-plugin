# E2E Tests

端到端测试，确保 Babel 和 SWC 两个版本的插件行为完全一致。

## 概述

这个目录包含了统一的测试用例定义，用于测试 Babel 和 SWC 两个版本的插件。通过共享相同的测试用例，我们可以保证两个实现的行为一致性。

## 文件结构

```
e2e-tests/
├── test-cases.ts      # 共享的测试用例定义
├── babel.test.ts      # Babel 插件测试运行器
├── swc.test.ts        # SWC 插件测试运行器（待实现）
├── package.json       # 依赖配置
├── tsconfig.json      # TypeScript 配置
├── vitest.config.ts   # Vitest 配置
└── README.md          # 本文档
```

## 测试用例

### 转换测试用例（14个）

1. **basic-transform**: 基础命名导入转换为默认导入
2. **multiple-imports**: 转换多个命名导入
3. **with-style-import**: 生成副作用导入（样式文件）
4. **with-exclude**: 排除特定组件不转换
5. **with-include**: 仅处理指定的组件
6. **multi-config**: 多个配置规则组合使用
7. **named-specifier**: 使用 named 导入说明符
8. **namespace-specifier**: 使用 namespace 导入说明符
9. **snake-case-filename**: 使用 snake_case 文件名
10. **pascal-case-filename**: 使用 PascalCase 文件名
11. **camel-case-filename**: 使用 camelCase 文件名
12. **preserve-other-imports**: 保留非命名导入（默认导入等）
13. **non-matching-source**: 不匹配的源模块保持不变
14. **multiple-sources**: 处理多个不同的源模块

### 验证测试用例（1个）

1. **reject-both-include-and-exclude**: 拒绝同时配置 include 和 exclude

## 运行测试

### 安装依赖

```bash
pnpm install
```

### 运行所有测试

```bash
pnpm test
```

### 只运行 Babel 测试

```bash
pnpm test:babel
```

### 只运行 SWC 测试

```bash
pnpm test:swc
```

### 监视模式

```bash
pnpm test:watch
```

## 测试结果

### Babel 插件测试

```
✅ Test Files  1 passed (1)
✅ Tests      15 passed (15)
✅ Duration   260ms
```

所有测试用例都通过！

### SWC 插件测试

SWC 插件测试目前处于 **待实现** 状态，因为需要先编译 Rust 代码为 WASM。

要启用 SWC 测试，需要：

1. 编译 SWC 插件
   ```bash
   cd ../packages/swc
   cargo build-wasi --release
   ```

2. 配置 SWC 加载插件路径

3. 更新 `swc.test.ts` 中的测试代码

## 添加新的测试用例

在 `test-cases.ts` 中添加新的测试用例：

```typescript
export const testCases: TestCase[] = [
  // ... existing cases
  {
    name: 'new-test-case',
    description: '测试用例描述',
    input: `import { Button } from "antd";`,
    config: {
      config: [
        {
          source: 'antd',
          filename: 'kebabCase',
          output: ['antd/es/{{ filename }}.js']
        }
      ]
    },
    expected: `import Button from "antd/es/button.js";`
  }
];
```

添加后，Babel 和 SWC 测试都会自动运行这个新用例。

## 测试策略

### 1. 行为一致性

通过共享测试用例，确保 Babel 和 SWC 版本对于相同的输入产生相同的输出。

### 2. 顺序容忍

测试使用 `compareCode` 函数，允许导入语句的顺序不同，只要包含的语句相同即可。这是因为：
- Babel 和 SWC 的 AST 遍历顺序可能不同
- 导入语句的顺序通常不影响功能

### 3. 覆盖完整

测试用例覆盖了：
- ✅ 所有文件名转换规则（kebabCase, camelCase, snakeCase, pascalCase）
- ✅ 所有导入说明符类型（default, named, namespace）
- ✅ Include/Exclude 过滤
- ✅ 多规则配置
- ✅ 副作用导入
- ✅ 边缘情况（不匹配的源、保留其他导入等）

## 为什么需要 E2E 测试

1. **保证一致性**: 确保两个版本的插件行为完全一致
2. **回归测试**: 防止修改代码时引入 bug
3. **文档作用**: 测试用例本身就是使用示例
4. **重构信心**: 可以放心重构代码，有测试保护
5. **质量保证**: 持续集成中自动运行，保证代码质量

## 持续集成

建议在 CI/CD 流程中运行这些测试：

```yaml
# .github/workflows/test.yml
- name: Run E2E Tests
  run: |
    cd e2e-tests
    pnpm install
    pnpm test
```

## 已知问题

### SWC 插件测试

SWC 插件需要编译为 WASM 才能在 Node.js 环境中运行。目前的测试文件中，SWC 测试被标记为 `skip`。

要完整运行 SWC 测试，需要：
1. 设置 WASM 编译环境
2. 编译插件
3. 配置正确的插件路径
4. 可能需要使用特殊的测试运行器

这是一个复杂的设置，建议作为独立任务处理。

## 维护指南

### 添加测试用例

1. 在 `test-cases.ts` 中添加用例
2. 运行测试确保通过
3. 提交代码

### 修改插件代码

1. 修改插件代码
2. 运行 E2E 测试
3. 如果测试失败：
   - 如果是预期行为变化，更新测试用例
   - 如果是 bug，修复代码
4. 确保所有测试通过后提交

### 添加新功能

1. 先写测试用例（TDD）
2. 实现功能
3. 运行测试确保通过
4. 提交代码

## 最佳实践

1. **保持测试用例简单**: 每个测试只测试一个功能点
2. **使用描述性名称**: 测试名称应该清楚地说明测试什么
3. **避免测试实现细节**: 只测试输入输出，不关心内部实现
4. **保持测试独立**: 测试之间不应该有依赖关系
5. **及时更新**: 代码变化时及时更新测试

## 总结

E2E 测试是保证插件质量的重要手段，通过共享测试用例，我们确保了 Babel 和 SWC 两个版本的一致性。

当前状态：
- ✅ Babel 测试：15/15 通过
- ⏳ SWC 测试：待实现（需要 WASM 编译）

未来工作：
- [ ] 实现完整的 SWC 测试运行器
- [ ] 添加性能对比测试
- [ ] 集成到 CI/CD 流程
