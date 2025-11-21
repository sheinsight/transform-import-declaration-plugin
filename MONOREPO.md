# Monorepo 架构说明

这是一个使用 **pnpm workspace** 管理的 monorepo 项目，包含 Babel 插件、SWC 插件和统一的 E2E 测试。

## 项目结构

```
transform-import-declaration-plugin/
├── packages/
│   ├── babel/              # Babel 插件 (TypeScript)
│   └── swc/                # SWC 插件 (Rust)
├── e2e-tests/              # 统一的 E2E 测试
├── examples/               # 示例项目（可选）
├── pnpm-workspace.yaml     # Workspace 配置
└── package.json            # 根目录配置
```

## Workspace 配置

**pnpm-workspace.yaml**:
```yaml
packages:
  - packages/*
  - e2e-tests
  - examples/*
```

## 统一命令

在项目根目录运行以下命令：

### 📦 安装依赖

```bash
pnpm install
```

这会安装所有子包的依赖，并自动链接内部依赖。

### 🏗️ 构建

```bash
# 构建所有 packages
pnpm build
```

等同于：
```bash
pnpm -r --filter './packages/*' run build
```

**说明**：
- 只构建 `packages/*` 下的子包
- 不构建 `e2e-tests`（测试包不需要构建）
- Babel 插件会输出到 `packages/babel/dist/`
- SWC 插件会输出到 `packages/swc/target/release/`

### 🧪 测试

#### 运行所有测试

```bash
pnpm test
```

这会运行：
- ✅ Babel 插件单元测试（22 个）
- ✅ SWC 插件单元测试（20 个）
- ✅ E2E 测试（15 个 Babel + 15 个 SWC）

#### 只运行单元测试

```bash
pnpm test:unit
```

等同于：
```bash
pnpm -r --filter './packages/*' run test
```

#### 只运行 E2E 测试

```bash
pnpm test:e2e
```

#### 只测试 Babel 版本

```bash
pnpm test:babel
```

#### 只测试 SWC 版本

```bash
pnpm test:swc
```

#### 监视模式

```bash
pnpm test:watch
```

所有子包都会进入测试监视模式。

### 🔄 开发模式

```bash
pnpm dev
```

等同于：
```bash
pnpm -r --parallel run dev
```

这会同时启动所有子包的开发模式：
- Babel: `tsup --watch`
- SWC: `cargo watch -x test`

### 🧹 清理

```bash
pnpm clean
```

清理所有构建产物和 node_modules。

## 子包管理

### 进入子包

```bash
cd packages/babel
pnpm test
pnpm build
```

### 为特定子包添加依赖

#### Babel 插件

```bash
# 在根目录运行
pnpm --filter @shined/babel-plugin-transform-import-declaration add some-package

# 或者进入子包
cd packages/babel
pnpm add some-package
```

#### SWC 插件

SWC 使用 Cargo 管理依赖：
```bash
cd packages/swc
cargo add some-crate
```

#### E2E 测试

```bash
pnpm --filter e2e-tests add some-package
```

### 为所有子包添加依赖

```bash
# 添加到根目录（共享依赖）
pnpm add -w some-package

# 添加到所有子包
pnpm -r add some-package
```

## pnpm 命令说明

### `-r` (recursive)

递归执行命令到所有子包：
```bash
pnpm -r run test      # 运行所有子包的 test 脚本
pnpm -r run build     # 运行所有子包的 build 脚本
```

### `--filter`

过滤特定子包：
```bash
# 单个包
pnpm --filter babel run test

# 使用 glob 模式
pnpm --filter './packages/*' run build

# 排除某些包
pnpm --filter '!e2e-tests' run test
```

### `--parallel`

并行执行命令：
```bash
pnpm -r --parallel run dev
```

### `-w` (workspace-root)

在根目录添加依赖：
```bash
pnpm add -w typescript
```

## 各子包脚本

### packages/babel

```json
{
  "scripts": {
    "build": "tsup",
    "build:lecp": "lecp",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf dist node_modules"
  }
}
```

### packages/swc

```json
{
  "scripts": {
    "build": "cargo build --release",
    "build:wasi": "cargo build-wasi --release",
    "test": "cargo test",
    "test:watch": "cargo watch -x test",
    "clean": "cargo clean",
    "dev": "cargo watch -x 'test'"
  }
}
```

### e2e-tests

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:babel": "vitest run babel.test.ts",
    "test:swc": "vitest run swc.test.ts",
    "clean": "rm -rf node_modules"
  }
}
```

## 工作流程

### 开发新功能

1. **添加测试用例**（TDD）
   ```bash
   # 编辑 e2e-tests/test-cases.ts
   vim e2e-tests/test-cases.ts
   ```

2. **运行测试**（确认失败）
   ```bash
   pnpm test:e2e
   ```

3. **实现功能**
   ```bash
   # Babel 版本
   cd packages/babel
   vim src/index.ts
   pnpm test:watch  # 监视模式

   # SWC 版本
   cd packages/swc
   vim src/transform.rs
   cargo watch -x test
   ```

4. **验证所有测试通过**
   ```bash
   cd ../..
   pnpm test
   ```

5. **构建**
   ```bash
   pnpm build
   ```

### 发布新版本

1. **更新版本号**
   ```bash
   cd packages/babel
   npm version patch  # 或 minor, major

   cd ../swc
   # 编辑 Cargo.toml 中的 version
   ```

2. **构建**
   ```bash
   pnpm build
   ```

3. **测试**
   ```bash
   pnpm test
   ```

4. **发布**
   ```bash
   # Babel 插件
   cd packages/babel
   npm publish

   # SWC 插件
   cd ../swc
   cargo publish
   ```

## CI/CD 配置建议

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - uses: actions-rust-lang/setup-rust-toolchain@v1

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build
```

## 最佳实践

### 1. 共享依赖

公共的开发依赖放在根目录：
```bash
pnpm add -w -D typescript vitest
```

### 2. 版本管理

使用 pnpm 的版本管理功能：
```bash
pnpm -r version patch
```

### 3. 依赖更新

```bash
# 检查过期的依赖
pnpm -r outdated

# 更新所有依赖
pnpm -r update
```

### 4. 缓存优化

pnpm 会自动共享依赖，节省磁盘空间：
```bash
# 查看存储信息
pnpm store status
```

### 5. 脚本命名规范

保持所有子包的脚本名称一致：
- `build`: 构建
- `test`: 运行测试
- `test:watch`: 测试监视模式
- `dev`: 开发模式
- `clean`: 清理

## 优势

### ✅ 统一管理

- 一个命令安装所有依赖
- 一个命令运行所有测试
- 一个命令构建所有包

### ✅ 依赖共享

- 公共依赖只安装一次
- 节省磁盘空间
- 确保版本一致

### ✅ 开发效率

- 快速切换包
- 并行开发
- 统一的工作流程

### ✅ 类型安全

- 内部包可以互相引用
- TypeScript 类型自动共享

### ✅ 测试保护

- E2E 测试确保两个版本一致
- 单元测试保护每个包
- 易于集成 CI/CD

## 常见问题

### Q: 为什么有些包没有 node_modules？

A: pnpm 使用符号链接和硬链接，依赖存储在全局 store 中，实际的 node_modules 很小。

### Q: 如何只构建某个包？

A: 使用 filter：
```bash
pnpm --filter babel run build
```

### Q: 如何添加内部依赖？

A: 在 package.json 中引用：
```json
{
  "dependencies": {
    "@shined/babel-plugin-transform-import-declaration": "workspace:*"
  }
}
```

### Q: 如何调试某个包？

A: 进入子包目录直接运行：
```bash
cd packages/babel
pnpm test:watch
```

## 总结

这个 monorepo 架构让我们能够：

1. ✅ 统一管理 Babel 和 SWC 两个版本
2. ✅ 共享测试用例，确保行为一致
3. ✅ 使用统一的命令构建和测试
4. ✅ 高效的依赖管理和缓存
5. ✅ 简化 CI/CD 配置

通过这种架构，我们可以同时维护两个实现，而不会增加太多的维护负担。
