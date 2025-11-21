"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, /**
 * Babel 插件：转换导入声明
 */ "default", {
    enumerable: true,
    get: function() {
        return transformImportDeclarationPlugin;
    }
});
var _types = /*#__PURE__*/ _interop_require_wildcard(require("@babel/types"));
var _transform = require("./transform.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function transformImportDeclarationPlugin() {
    return {
        name: 'transform-import-declaration',
        visitor: {
            Program: {
                enter: function enter(_, state) {
                    // 在程序开始时验证配置
                    var config = state.opts;
                    if (!config || !config.config) {
                        throw new Error('Missing plugin configuration');
                    }
                    (0, _transform.validateConfig)(config.config);
                }
            },
            ImportDeclaration: function ImportDeclaration(path, state) {
                var config = state.opts;
                var node = path.node;
                // Skip type-only imports (e.g., import type { Foo } from 'bar')
                if (node.importKind === 'type') {
                    return;
                }
                // 获取源模块名称
                var source = node.source.value;
                // 查找所有匹配此 source 的配置
                var matchingConfigs = config.config.filter(function(c) {
                    return c.source === source;
                });
                if (matchingConfigs.length === 0) {
                    return;
                }
                // 收集需要转换的命名导入 (排除 type-only 导入)
                var namedImports = node.specifiers.filter(function(spec) {
                    return spec.type === 'ImportSpecifier' && spec.importKind !== 'type';
                });
                if (namedImports.length === 0) {
                    return;
                }
                // 收集未被处理的导入说明符 (包括非命名导入和 type-only 导入)
                var unprocessedSpecifiers = node.specifiers.filter(function(spec) {
                    return spec.type !== 'ImportSpecifier' || spec.importKind === 'type';
                });
                // 创建新的导入声明
                var newImports = [];
                // 处理每个命名导入
                namedImports.forEach(function(specifier) {
                    var importedName = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value;
                    var localName = specifier.local.name;
                    // 尝试找到第一个匹配的配置
                    var matchedConfig = null;
                    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    try {
                        for(var _iterator = matchingConfigs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                            var cfg = _step.value;
                            if ((0, _transform.configMatches)(cfg, importedName)) {
                                matchedConfig = cfg;
                                break;
                            }
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally{
                        try {
                            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                                _iterator["return"]();
                            }
                        } finally{
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }
                    if (!matchedConfig) {
                        // 如果没有匹配的配置，保留原始导入
                        unprocessedSpecifiers.push(specifier);
                        return;
                    }
                    // 转换文件名
                    var filename = (0, _transform.transformFilename)(importedName, matchedConfig.filename);
                    // 生成导入路径
                    var paths = matchedConfig.output.map(function(template) {
                        return template.replace(/\{\{\s*filename\s*\}\}/g, filename);
                    });
                    // 确定导入说明符类型
                    var specifierType = matchedConfig.specifier || 'default';
                    // 第一个路径：主导入（根据 specifier 类型）
                    if (paths.length > 0) {
                        var mainPath = paths[0];
                        switch(specifierType){
                            case 'default':
                                // import Button from 'path'
                                newImports.push(_types.importDeclaration([
                                    _types.importDefaultSpecifier(_types.identifier(localName))
                                ], _types.stringLiteral(mainPath)));
                                break;
                            case 'named':
                                // import { Button } from 'path'
                                newImports.push(_types.importDeclaration([
                                    _types.importSpecifier(_types.identifier(localName), _types.identifier(importedName))
                                ], _types.stringLiteral(mainPath)));
                                break;
                            case 'namespace':
                                // import * as Button from 'path'
                                newImports.push(_types.importDeclaration([
                                    _types.importNamespaceSpecifier(_types.identifier(localName))
                                ], _types.stringLiteral(mainPath)));
                                break;
                        }
                    }
                    // 其余路径：副作用导入
                    for(var i = 1; i < paths.length; i++){
                        newImports.push(_types.importDeclaration([], _types.stringLiteral(paths[i])));
                    }
                });
                // 如果所有导入都被处理了，替换原始导入
                if (unprocessedSpecifiers.length === 0) {
                    path.replaceWithMultiple(newImports);
                } else {
                    // 保留未处理的导入，并添加新的导入
                    node.specifiers = unprocessedSpecifiers;
                    path.insertAfter(newImports);
                }
            }
        }
    };
}

//# sourceMappingURL=index.js.map