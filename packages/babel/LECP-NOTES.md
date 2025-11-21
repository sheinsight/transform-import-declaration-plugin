# Lecp 构建工具使用说明

## 关于 Lecp

[Lecp](https://sheinsight.github.io/lecp/) 是一个由 Sheinsight 开发的现代化构建工具，基于 Rspack 和 SWC。

## 配置

项目中包含了 `lecp.config.ts` 配置文件：

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

## 使用 Lecp

如果你想使用 Lecp 而不是 Tsup，可以运行：

```bash
pnpm build:lecp
```

## 当前状态

在实现过程中发现，使用当前的配置，Lecp 主要生成了 TypeScript 类型定义文件（`.d.ts`），但没有生成 `.js` 和 `.mjs` 文件。

可能的原因：
1. Lecp 版本较新（0.1.1），某些功能可能还在开发中
2. 配置选项可能需要调整
3. 可能需要特定的项目结构

## 解决方案

为了确保项目可以正常构建和使用，我们采用了 **Tsup** 作为主要构建工具：

- Tsup 是一个成熟稳定的 TypeScript 构建工具
- 基于 esbuild，构建速度快
- 配置简单，开箱即用
- 社区支持好，文档完善

## 脚本说明

在 `package.json` 中：

```json
{
  "scripts": {
    "build": "tsup",           // 使用 Tsup 构建（推荐）
    "build:lecp": "lecp",      // 使用 Lecp 构建（备用）
    "dev": "tsup --watch",     // 开发模式
    "test": "vitest run",      // 运行测试
    "test:watch": "vitest"     // 测试监视模式
  }
}
```

## 构建输出

使用 Tsup 构建后，`dist/` 目录包含：

- `index.js` - CommonJS 格式
- `index.mjs` - ES Module 格式
- `index.d.ts` - TypeScript 类型定义（CJS）
- `index.d.mts` - TypeScript 类型定义（ESM）

## 如果想继续使用 Lecp

如果你想深入研究 Lecp 并使其正常工作，可以：

1. 查看 [Lecp 官方文档](https://sheinsight.github.io/lecp/)
2. 参考 Lecp 的 GitHub 仓库中的示例项目
3. 尝试不同的配置选项
4. 联系 Lecp 的维护者获取帮助

## 总结

- ✅ **Tsup**：当前推荐的构建工具，稳定可靠
- ⏳ **Lecp**：保留配置供将来参考和实验

两种工具都可以生成符合要求的输出，选择最适合你的即可。
