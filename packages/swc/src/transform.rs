use heck::{ToKebabCase, ToLowerCamelCase, ToPascalCase, ToSnakeCase};
use serde::Deserialize;
use swc_core::common::DUMMY_SP;
use swc_core::ecma::ast::*;
use swc_core::ecma::visit::VisitMut;

/// 文件名转换规则
#[derive(Clone, Debug, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum FilenameCase {
    KebabCase,
    CamelCase,
    SnakeCase,
    PascalCase,
}

/// 导入说明符类型
#[derive(Clone, Debug, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum SpecifierType {
    Default,
    Named,
    Namespace,
}

impl Default for SpecifierType {
    fn default() -> Self {
        SpecifierType::Default
    }
}

/// 单个转换配置
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformConfig {
    /// 源模块名称
    pub source: String,
    /// 文件名转换规则
    pub filename: FilenameCase,
    /// 输出路径模板数组
    pub output: Vec<String>,
    /// 导入说明符类型，默认为 default
    #[serde(default)]
    pub specifier: SpecifierType,
    /// 只处理指定的组件名称
    #[serde(default)]
    pub include: Option<Vec<String>>,
    /// 排除指定的组件名称
    #[serde(default)]
    pub exclude: Option<Vec<String>>,
}

/// 插件配置
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginConfig {
    pub config: Vec<TransformConfig>,
}

impl PluginConfig {
    /// 验证配置的有效性
    pub fn validate(&self) -> Result<(), String> {
        for (index, config) in self.config.iter().enumerate() {
            // 检查 include 和 exclude 不能同时存在
            if config.include.is_some() && config.exclude.is_some() {
                return Err(format!(
                    "配置 #{} (source: '{}'): include 和 exclude 不能同时配置。\n\
                    请选择其中一个：\n\
                    - 使用 include 指定要处理的组件（白名单）\n\
                    - 使用 exclude 指定要排除的组件（黑名单）",
                    index, config.source
                ));
            }
        }
        Ok(())
    }
}

impl TransformConfig {
    /// 检查组件名称是否匹配当前配置
    ///
    /// 匹配规则：
    /// - 如果配置了 include（白名单），只处理列表中的组件
    /// - 如果配置了 exclude（黑名单），处理所有组件除了列表中的
    /// - 如果都没配置，处理所有组件
    ///
    /// 注意：include 和 exclude 互斥，不能同时配置
    pub fn matches(&self, name: &str) -> bool {
        let name_string = name.to_string();

        // 如果配置了 include（白名单），只处理列表中的
        if let Some(ref include) = self.include {
            return include.contains(&name_string);
        }

        // 如果配置了 exclude（黑名单），排除列表中的
        if let Some(ref exclude) = self.exclude {
            return !exclude.contains(&name_string);
        }

        // 都没配置，匹配所有组件
        true
    }
}

/// 文件名转换工具函数
pub fn transform_filename(name: &str, case: &FilenameCase) -> String {
    match case {
        FilenameCase::KebabCase => name.to_kebab_case(),
        FilenameCase::CamelCase => name.to_lower_camel_case(),
        FilenameCase::SnakeCase => name.to_snake_case(),
        FilenameCase::PascalCase => name.to_pascal_case(),
    }
}

/// 导入转换访问器
pub struct ImportTransformer {
    config: PluginConfig,
}

impl ImportTransformer {
    pub fn new(config: PluginConfig) -> Self {
        Self { config }
    }

    /// 为给定的组件名称和配置生成导入声明
    fn generate_imports(&self, local_name: &str, config: &TransformConfig) -> Vec<ModuleItem> {
        let transformed_filename = transform_filename(local_name, &config.filename);
        let mut imports = Vec::new();

        for (index, output_template) in config.output.iter().enumerate() {
            let import_path = output_template.replace("{{ filename }}", &transformed_filename);

            if index == 0 {
                // 第一个 output 生成主导入（根据 specifier 类型）
                let import_decl = match config.specifier {
                    SpecifierType::Default => {
                        // import Button from "path"
                        ImportDecl {
                            span: DUMMY_SP,
                            specifiers: vec![ImportSpecifier::Default(ImportDefaultSpecifier {
                                span: DUMMY_SP,
                                local: Ident::new(local_name.into(), DUMMY_SP, Default::default()),
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
                        // import { Button } from "path"
                        ImportDecl {
                            span: DUMMY_SP,
                            specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
                                span: DUMMY_SP,
                                local: Ident::new(local_name.into(), DUMMY_SP, Default::default()),
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
                        // import * as Button from "path"
                        ImportDecl {
                            span: DUMMY_SP,
                            specifiers: vec![ImportSpecifier::Namespace(ImportStarAsSpecifier {
                                span: DUMMY_SP,
                                local: Ident::new(local_name.into(), DUMMY_SP, Default::default()),
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
                // 后续 output 生成副作用导入
                // import "path"
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
}

impl VisitMut for ImportTransformer {
    fn visit_mut_module_items(&mut self, items: &mut Vec<ModuleItem>) {
        let mut new_items = Vec::new();

        for item in items.drain(..) {
            match item {
                ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)) => {
                    let source = &import_decl.src.value;

                    // 收集所有匹配当前source的配置
                    let matched_configs: Vec<&TransformConfig> =
                        if let Some(source_str) = source.as_str() {
                            self.config
                                .config
                                .iter()
                                .filter(|config| config.source.as_str() == source_str)
                                .collect()
                        } else {
                            Vec::new()
                        };

                    if !matched_configs.is_empty() {
                        // 处理命名导入
                        let mut unprocessed_specifiers = Vec::new();

                        for specifier in import_decl.specifiers {
                            match specifier {
                                ImportSpecifier::Named(named) => {
                                    let local_name = named.local.sym.as_str().to_string();

                                    // 尝试每个配置，找到第一个匹配的
                                    let mut matched = false;
                                    for config in &matched_configs {
                                        if config.matches(&local_name) {
                                            // 生成转换后的导入
                                            let generated_imports =
                                                self.generate_imports(&local_name, config);
                                            new_items.extend(generated_imports);
                                            matched = true;
                                            break; // 找到匹配的配置后停止
                                        }
                                    }

                                    if !matched {
                                        // 没有任何配置匹配这个组件
                                        // 根据需求，如果所有配置都不匹配（都exclude了），则不生成任何导入
                                        // 只有当完全没有配置处理这个source时，才保留原导入
                                        // 因为我们已经在 matched_configs 中有配置了，所以这里不保留
                                        // unprocessed_specifiers.push(ImportSpecifier::Named(named));
                                    }
                                }
                                // 保留默认导入和命名空间导入
                                other => {
                                    unprocessed_specifiers.push(other);
                                }
                            }
                        }

                        // 如果还有未处理的说明符，保留原导入声明
                        if !unprocessed_specifiers.is_empty() {
                            new_items.push(ModuleItem::ModuleDecl(ModuleDecl::Import(
                                ImportDecl {
                                    span: import_decl.span,
                                    specifiers: unprocessed_specifiers,
                                    src: import_decl.src,
                                    type_only: import_decl.type_only,
                                    with: import_decl.with,
                                    phase: import_decl.phase,
                                },
                            )));
                        }
                    } else {
                        // 没有匹配的配置，保留原导入
                        new_items.push(ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)));
                    }
                }
                other => {
                    new_items.push(other);
                }
            }
        }

        *items = new_items;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_kebab_case() {
        assert_eq!("Button".to_kebab_case(), "button");
        assert_eq!("DatePicker".to_kebab_case(), "date-picker");
        assert_eq!("MyComponent".to_kebab_case(), "my-component");
        assert_eq!("XMLHttpRequest".to_kebab_case(), "xml-http-request");
    }

    #[test]
    fn test_to_camel_case() {
        assert_eq!("Button".to_lower_camel_case(), "button");
        assert_eq!("DatePicker".to_lower_camel_case(), "datePicker");
        assert_eq!("MyComponent".to_lower_camel_case(), "myComponent");
    }

    #[test]
    fn test_to_snake_case() {
        assert_eq!("Button".to_snake_case(), "button");
        assert_eq!("DatePicker".to_snake_case(), "date_picker");
        assert_eq!("MyComponent".to_snake_case(), "my_component");
    }

    #[test]
    fn test_transform_filename() {
        assert_eq!(transform_filename("DatePicker", &FilenameCase::KebabCase), "date-picker");
        assert_eq!(transform_filename("DatePicker", &FilenameCase::CamelCase), "datePicker");
        assert_eq!(transform_filename("DatePicker", &FilenameCase::SnakeCase), "date_picker");
        assert_eq!(transform_filename("DatePicker", &FilenameCase::PascalCase), "DatePicker");
    }

    #[test]
    fn test_config_matches_with_include() {
        let config = TransformConfig {
            source: "antd".to_string(),
            filename: FilenameCase::KebabCase,
            output: vec!["antd/es/{{ filename }}.js".to_string()],
            specifier: SpecifierType::Default,
            include: Some(vec!["Button".to_string()]),
            exclude: None,
        };

        assert!(config.matches("Button"));
        assert!(!config.matches("DatePicker"));
    }

    #[test]
    fn test_config_matches_with_exclude() {
        let config = TransformConfig {
            source: "antd".to_string(),
            filename: FilenameCase::KebabCase,
            output: vec!["antd/es/{{ filename }}.js".to_string()],
            specifier: SpecifierType::Default,
            include: None,
            exclude: Some(vec!["Button".to_string()]),
        };

        assert!(!config.matches("Button"));
        assert!(config.matches("DatePicker"));
    }

    #[test]
    fn test_config_matches_without_filters() {
        let config = TransformConfig {
            source: "antd".to_string(),
            filename: FilenameCase::KebabCase,
            output: vec!["antd/es/{{ filename }}.js".to_string()],
            specifier: SpecifierType::Default,
            include: None,
            exclude: None,
        };

        assert!(config.matches("Button"));
        assert!(config.matches("DatePicker"));
        assert!(config.matches("AnyComponent"));
    }

    #[test]
    fn test_config_validation_rejects_both_include_and_exclude() {
        // 测试验证逻辑：不允许同时配置 include 和 exclude
        let config = PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::KebabCase,
                output: vec!["antd/es/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Default,
                include: Some(vec!["Button".to_string()]),
                exclude: Some(vec!["Table".to_string()]),
            }],
        };

        let result = config.validate();
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("include 和 exclude 不能同时配置"));
    }

    #[test]
    fn test_config_validation_allows_only_include() {
        // 只有 include，应该通过验证
        let config = PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::KebabCase,
                output: vec!["antd/es/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Default,
                include: Some(vec!["Button".to_string()]),
                exclude: None,
            }],
        };

        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_config_validation_allows_only_exclude() {
        // 只有 exclude，应该通过验证
        let config = PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::KebabCase,
                output: vec!["antd/es/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Default,
                include: None,
                exclude: Some(vec!["Button".to_string()]),
            }],
        };

        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_config_validation_allows_neither() {
        // 两个都没有，应该通过验证
        let config = PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::KebabCase,
                output: vec!["antd/es/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Default,
                include: None,
                exclude: None,
            }],
        };

        assert!(config.validate().is_ok());
    }
}

#[cfg(test)]
mod integration_tests {
    use swc_core::ecma::{transforms::testing::test_inline, visit::visit_mut_pass};

    use super::*;
    // Integration tests using test_inline macro
    test_inline!(
        Default::default(),
        |_| visit_mut_pass(ImportTransformer::new(PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::KebabCase,
                output: vec!["antd/es/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Default,
                include: None,
                exclude: None,
            }],
        })),
        test_basic_transform,
        r#"import { Button } from "antd";"#,
        r#"import Button from "antd/es/button.js";"#
    );

    test_inline!(
        Default::default(),
        |_| visit_mut_pass(ImportTransformer::new(PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::KebabCase,
                output: vec![
                    "antd/es/{{ filename }}.js".to_string(),
                    "antd/css/{{ filename }}.css".to_string(),
                ],
                specifier: SpecifierType::Default,
                include: None,
                exclude: None,
            }],
        })),
        test_with_style_import,
        r#"import { Button } from "antd";"#,
        r#"
import Button from "antd/es/button.js";
import "antd/css/button.css";
    "#
    );

    test_inline!(
        Default::default(),
        |_| visit_mut_pass(ImportTransformer::new(PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::KebabCase,
                output: vec!["antd/es/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Default,
                include: None,
                exclude: Some(vec!["Button".to_string()]),
            }],
        })),
        test_with_exclude,
        r#"import { Button, DatePicker } from "antd";"#,
        r#"
import DatePicker from "antd/es/date-picker.js";
    "#
    );

    test_inline!(
        Default::default(),
        |_| visit_mut_pass(ImportTransformer::new(PluginConfig {
            config: vec![
                TransformConfig {
                    source: "antd".to_string(),
                    filename: FilenameCase::KebabCase,
                    output: vec![
                        "antd/es/{{ filename }}.js".to_string(),
                        "antd/css/{{ filename }}.css".to_string(),
                    ],
                    specifier: SpecifierType::Default,
                    include: None,
                    exclude: Some(vec!["Button".to_string()]),
                },
                TransformConfig {
                    source: "antd".to_string(),
                    filename: FilenameCase::KebabCase,
                    output: vec![
                        "antd/es/{{ filename }}.js".to_string(),
                        "antd/css/{{ filename }}.png".to_string(),
                    ],
                    specifier: SpecifierType::Default,
                    include: Some(vec!["Button".to_string()]),
                    exclude: None,
                },
            ],
        })),
        test_multi_config,
        r#"import { Button, DatePicker } from "antd";"#,
        r#"
import Button from "antd/es/button.js";
import "antd/css/button.png";
import DatePicker from "antd/es/date-picker.js";
import "antd/css/date-picker.css";
    "#
    );

    test_inline!(
        Default::default(),
        |_| visit_mut_pass(ImportTransformer::new(PluginConfig {
            config: vec![TransformConfig {
                source: "lodash".to_string(),
                filename: FilenameCase::CamelCase,
                output: vec!["lodash/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Named,
                include: None,
                exclude: None,
            }],
        })),
        test_named_specifier,
        r#"import { debounce, throttle } from "lodash";"#,
        r#"
import { debounce } from "lodash/debounce.js";
import { throttle } from "lodash/throttle.js";
    "#
    );

    test_inline!(
        Default::default(),
        |_| visit_mut_pass(ImportTransformer::new(PluginConfig {
            config: vec![TransformConfig {
                source: "utils".to_string(),
                filename: FilenameCase::CamelCase,
                output: vec!["utils/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Namespace,
                include: None,
                exclude: None,
            }],
        })),
        test_namespace_specifier,
        r#"import { DateUtils, StringUtils } from "utils";"#,
        r#"
import * as DateUtils from "utils/dateUtils.js";
import * as StringUtils from "utils/stringUtils.js";
    "#
    );

    test_inline!(
        Default::default(),
        |_| visit_mut_pass(ImportTransformer::new(PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::SnakeCase,
                output: vec!["antd/es/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Default,
                include: None,
                exclude: None,
            }],
        })),
        test_snake_case,
        r#"import { DatePicker } from "antd";"#,
        r#"import DatePicker from "antd/es/date_picker.js";"#
    );

    test_inline!(
        Default::default(),
        |_| visit_mut_pass(ImportTransformer::new(PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::PascalCase,
                output: vec!["antd/es/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Default,
                include: None,
                exclude: None,
            }],
        })),
        test_pascal_case,
        r#"import { DatePicker } from "antd";"#,
        r#"import DatePicker from "antd/es/DatePicker.js";"#
    );

    test_inline!(
        Default::default(),
        |_| visit_mut_pass(ImportTransformer::new(PluginConfig {
            config: vec![TransformConfig {
                source: "antd".to_string(),
                filename: FilenameCase::KebabCase,
                output: vec!["antd/es/{{ filename }}.js".to_string()],
                specifier: SpecifierType::Default,
                include: None,
                exclude: None,
            }],
        })),
        test_preserve_other_imports,
        r#"
import React from "react";
import { Button } from "antd";
import { useState } from "react";
    "#,
        r#"
import React from "react";
import Button from "antd/es/button.js";
import { useState } from "react";
    "#
    );
}
