# SWC 插件变量重命名 Bug 分析与修复方案

## Bug 现象

在 E2E 测试中，SWC 插件会将导入的变量名改变：

**输入代码：**
```javascript
import { Button } from "antd"
console.log(Button)
```

**预期输出：**
```javascript
import Button from "antd/es/button/index.js"
console.log(Button)
```

**实际输出：**
```javascript
import Button1 from "antd/es/button/index.js"
console.log(Button)
```

注意：`Button` 被重命名为 `Button1`，导致代码引用断裂。

## 根本原因分析

### SWC 的 SyntaxContext 机制

SWC 使用 **SyntaxContext**（语法上下文）来跟踪变量的作用域和绑定关系。每个标识符（Ident）都有三个组成部分：

1. **符号名称**（Symbol）：变量的文本名称，如 "Button"
2. **位置信息**（Span）：源代码中的位置
3. **语法上下文**（SyntaxContext）：唯一标识这个绑定的上下文 ID

### 问题根源

在 `packages/swc/src/transform.rs` 中，插件创建新的 `Ident` 时使用了错误的 SyntaxContext：

**问题代码位置：**
- 第 153 行（Default import）
- 第 171 行（Named import）
- 第 191 行（Namespace import）

```rust
// 第 153 行 - 创建 default import
local: Ident::new(local_name.into(), DUMMY_SP, Default::default())
                                                  ^^^^^^^^^^^^^^^^
                                                  问题所在！
```

### 为什么会导致重命名？

1. **原始代码的绑定关系：**
   ```javascript
   import { Button } from "antd"  // Button 有 SyntaxContext(ctx1)
   console.log(Button)             // 引用的是 ctx1 的 Button
   ```

2. **插件处理后：**
   - 删除了原来的 `import { Button }`（ctx1 被移除）
   - 创建新的 `import Button from "..."`，使用 `Default::default()` 生成新的 SyntaxContext(ctx2)

3. **SWC Hygiene 系统检测到问题：**
   - 代码中有对 ctx1 的 `Button` 的引用
   - 新导入创建的是 ctx2 的 `Button`
   - 这是两个**不同的绑定**！
   - 为了保持正确性，SWC 将 ctx2 的 `Button` 重命名为 `Button1`，避免命名冲突

### 示意图

```
原始代码状态：
┌─────────────────────────────────────┐
│ import { Button } from "antd"       │ <- Button(ctx1)
│                                     │
│ console.log(Button)                 │ <- 引用 Button(ctx1)
└─────────────────────────────────────┘

插件处理后（错误）：
┌─────────────────────────────────────┐
│ import Button from "antd/es/..."    │ <- Button(ctx2) ← 新创建的上下文！
│                                     │
│ console.log(Button)                 │ <- 仍然引用 Button(ctx1)！
└─────────────────────────────────────┘
    ↓ SWC Hygiene 检测到不匹配
┌─────────────────────────────────────┐
│ import Button1 from "antd/es/..."   │ <- 被重命名为 Button1
│                                     │
│ console.log(Button)                 │ <- 引用失效！
└─────────────────────────────────────┘
```

## 修复方案

### 核心思路

**复用原始标识符的 SyntaxContext**，而不是创建新的。

### 详细修复步骤

#### 1. 修改 `generate_imports` 方法签名

**当前代码（transform.rs:132-137）：**
```rust
fn generate_imports(
    &self,
    imported_name: &str,
    local_name: &str,  // ← 只传递字符串
    config: &TransformConfig,
) -> Vec<ModuleItem>
```

**修复后：**
```rust
fn generate_imports(
    &self,
    imported_name: &str,
    local_ident: &Ident,  // ← 传递完整的 Ident，包含 SyntaxContext
    config: &TransformConfig,
) -> Vec<ModuleItem>
```

#### 2. 更新 `generate_imports` 方法内部实现

**当前代码（transform.rs:153）：**
```rust
local: Ident::new(local_name.into(), DUMMY_SP, Default::default())
```

**修复后：**
```rust
local: Ident::new(
    local_ident.sym.clone(),      // 使用原始符号名称
    DUMMY_SP,                      // 位置信息可以用 DUMMY_SP
    local_ident.ctxt               // ← 关键：复用原始的 SyntaxContext！
)
```

或者更简洁：
```rust
local: local_ident.clone()  // 直接克隆原始 Ident
```

#### 3. 更新调用处

**当前代码（transform.rs:267-281）：**
```rust
// 获取本地变量名
let local_name = named.local.sym.as_ref().to_string();

// 调用 generate_imports
let generated_imports =
    self.generate_imports(&imported_name, &local_name, config);
                                          ^^^^^^^^^^^
                                          只传递字符串
```

**修复后：**
```rust
// 保留原始 Ident
let local_ident = &named.local;

// 调用 generate_imports
let generated_imports =
    self.generate_imports(&imported_name, local_ident, config);
                                          ^^^^^^^^^^^
                                          传递完整 Ident
```

### 完整修改示例

**修改 transform.rs 第 132-223 行的 `generate_imports` 方法：**

```rust
fn generate_imports(
    &self,
    imported_name: &str,
    local_ident: &Ident,  // 改为接收 Ident 引用
    config: &TransformConfig,
) -> Vec<ModuleItem> {
    let transformed_filename = transform_filename(imported_name, &config.filename);
    let mut imports = Vec::new();

    for (index, output_template) in config.output.iter().enumerate() {
        let import_path = output_template.replace("{{ filename }}", &transformed_filename);

        if index == 0 {
            let import_decl = match config.specifier {
                SpecifierType::Default => {
                    ImportDecl {
                        span: DUMMY_SP,
                        specifiers: vec![ImportSpecifier::Default(ImportDefaultSpecifier {
                            span: DUMMY_SP,
                            local: local_ident.clone(),  // 直接克隆原始 Ident
                        })],
                        src: Box::new(Str {
                            span: DUMMY_SP,
                            value: import_path.into(),
                            raw: None,
                        }),
                        type_only: false,
                        with: None,
                        phase: Default::default(),
                    }
                }
                SpecifierType::Named => {
                    ImportDecl {
                        span: DUMMY_SP,
                        specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
                            span: DUMMY_SP,
                            local: local_ident.clone(),  // 直接克隆原始 Ident
                            imported: None,
                            is_type_only: false,
                        })],
                        src: Box::new(Str {
                            span: DUMMY_SP,
                            value: import_path.into(),
                            raw: None,
                        }),
                        type_only: false,
                        with: None,
                        phase: Default::default(),
                    }
                }
                SpecifierType::Namespace => {
                    ImportDecl {
                        span: DUMMY_SP,
                        specifiers: vec![ImportSpecifier::Namespace(ImportStarAsSpecifier {
                            span: DUMMY_SP,
                            local: local_ident.clone(),  // 直接克隆原始 Ident
                        })],
                        src: Box::new(Str {
                            span: DUMMY_SP,
                            value: import_path.into(),
                            raw: None,
                        }),
                        type_only: false,
                        with: None,
                        phase: Default::default(),
                    }
                }
            };

            imports.push(ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)));
        } else {
            // 副作用导入保持不变
            let import_decl = ImportDecl {
                span: DUMMY_SP,
                specifiers: vec![],
                src: Box::new(Str { span: DUMMY_SP, value: import_path.into(), raw: None }),
                type_only: false,
                with: None,
                phase: Default::default(),
            };

            imports.push(ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)));
        }
    }

    imports
}
```

**修改 transform.rs 第 253-286 行的调用处：**

```rust
for specifier in import_decl.specifiers {
    match specifier {
        ImportSpecifier::Named(named) => {
            // 获取原始导入名称
            let imported_name = match &named.imported {
                Some(module_export_name) => match module_export_name {
                    ModuleExportName::Ident(ident) => {
                        ident.sym.as_ref().to_string()
                    }
                    ModuleExportName::Str(s) => {
                        s.value.as_str().unwrap_or_default().to_string()
                    }
                },
                None => named.local.sym.as_ref().to_string(),
            };

            // 保留完整的 local Ident（包含 SyntaxContext）
            let local_ident = &named.local;

            // 跳过 type-only 导入
            if named.is_type_only {
                unprocessed_specifiers.push(ImportSpecifier::Named(named));
                continue;
            }

            // 尝试匹配配置
            let mut matched = false;
            for config in &matched_configs {
                if config.matches(&imported_name) {
                    // 传递完整的 Ident，而非字符串
                    let generated_imports =
                        self.generate_imports(&imported_name, local_ident, config);
                    new_items.extend(generated_imports);
                    matched = true;
                    break;
                }
            }

            if !matched {
                unprocessed_specifiers.push(ImportSpecifier::Named(named));
            }
        }
        other => {
            unprocessed_specifiers.push(other);
        }
    }
}
```

## 验证修复

修复后，测试用例应该通过：

```javascript
// 输入
import { Button } from "antd"
console.log(Button)

// 输出（正确）
import Button from "antd/es/button/index.js"
console.log(Button)  // ✓ Button 不会被重命名
```

## 相关文件

- `packages/swc/src/transform.rs` - 需要修改的核心文件
- `e2e-tests/test-cases.ts:19-40` - 失败的测试用例
- `e2e-tests/swc.test.ts` - SWC E2E 测试

## 参考资料

- [SWC Hygiene 机制](https://swc.rs/docs/usage/core#hygiene)
- [SWC AST 节点定义](https://rustdoc.swc.rs/swc_ecma_ast/)
- SWC 源码中 `SyntaxContext` 的实现
