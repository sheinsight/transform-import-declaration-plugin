# 依赖库选择说明

## 命名转换库：`heck` v0.5

### 为什么选择 `heck`？

`heck` 是 Rust 社区中最流行和成熟的命名转换库，我们选择它有以下原因：

### 1. **社区认可度高**
- 超过 400 万次下载
- 被众多知名 Rust 项目使用（如 `cargo`, `rustfmt` 等）
- GitHub stars 900+

### 2. **功能完善**
支持所有常见的命名转换：
- `ToKebabCase`: `DatePicker` → `date-picker`
- `ToLowerCamelCase`: `DatePicker` → `datePicker`
- `ToSnakeCase`: `DatePicker` → `date_picker`
- `ToPascalCase`: `DatePicker` → `DatePicker`
- `ToUpperCamelCase`: `date-picker` → `DatePicker`
- `ToShoutySnakeCase`: `date-picker` → `DATE_PICKER`
- `ToShoutyKebabCase`: `date-picker` → `DATE-KEBAB-CASE`
- `ToTitleCase`: `date-picker` → `Date Picker`
- `ToTrainCase`: `date-picker` → `Date-Picker`

### 3. **性能优秀**
- 零依赖（除了 `unicode-segmentation`）
- 编译速度快
- 运行时性能优秀
- 内存占用小

### 4. **API 设计优雅**
使用 Rust trait 扩展的方式，符合 Rust 社区习惯：

```rust
use heck::ToKebabCase;

let s = "DatePicker";
s.to_kebab_case(); // "date-picker"
```

### 5. **维护活跃**
- 由 Rust 社区核心成员维护
- 定期更新，支持最新的 Rust 版本
- 文档完善，有大量示例

### 6. **轻量级**
```toml
[dependencies]
heck = "0.5"  # 只需一行依赖
```

## 替代方案对比

### `convert_case`
- **优点**: API 统一，使用枚举而非 trait
- **缺点**: 下载量较少（约 100 万），社区接受度不如 `heck`
- **适用场景**: 如果需要运行时动态选择转换类型

```rust
use convert_case::{Case, Casing};
"DatePicker".to_case(Case::Kebab);  // "date-picker"
```

### `inflector`
- **优点**: 功能更全面（复数、单数、序数等）
- **缺点**:
  - 更重量级，依赖更多
  - 编译时间更长
  - 对于我们的需求来说功能过剩
- **适用场景**: 需要完整的英语语法转换

### 自己实现
- **优点**: 完全控制逻辑，无外部依赖
- **缺点**:
  - 需要处理各种边界情况
  - Unicode 支持困难
  - 需要编写和维护大量测试
  - 容易出现 bug
- **不推荐**: 除非有特殊需求

## 结论

对于我们的插件来说，**`heck` 是最佳选择**：

✅ 成熟稳定，经过大量项目验证
✅ 性能优秀，轻量级
✅ API 简洁，符合 Rust 习惯
✅ 社区支持好，维护活跃
✅ 满足所有需求

## 使用示例

```rust
use heck::{ToKebabCase, ToLowerCamelCase, ToSnakeCase, ToPascalCase};

// kebab-case
"DatePicker".to_kebab_case()  // "date-picker"

// camelCase
"DatePicker".to_lower_camel_case()  // "datePicker"

// snake_case
"DatePicker".to_snake_case()  // "date_picker"

// PascalCase
"date-picker".to_pascal_case()  // "DatePicker"
```

## 更新历史

- **v0.5**: 当前使用版本，支持最新的命名转换规则
- **v0.4**: 添加了更多转换类型
- **v0.3**: 性能优化

## 相关链接

- [crates.io](https://crates.io/crates/heck)
- [GitHub](https://github.com/withoutboats/heck)
- [文档](https://docs.rs/heck)
