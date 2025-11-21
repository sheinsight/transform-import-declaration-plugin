import type { FilenameCase, TransformConfig } from "./types.js";
/**
 * 根据规则转换文件名
 * 使用 change-case 库进行转换
 */
export declare function transformFilename(name: string, caseType: FilenameCase): string;
/**
 * 检查配置是否匹配给定的组件名
 */
export declare function configMatches(config: TransformConfig, name: string): boolean;
/**
 * 验证配置的有效性
 * @throws {Error} 如果配置无效
 */
export declare function validateConfig(configs: TransformConfig[]): void;
//# sourceMappingURL=transform.d.ts.map