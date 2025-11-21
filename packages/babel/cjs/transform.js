"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get configMatches () {
        return configMatches;
    },
    get transformFilename () {
        return transformFilename;
    },
    get validateConfig () {
        return validateConfig;
    }
});
var _changecase = require("change-case");
function transformFilename(name, caseType) {
    switch(caseType){
        case 'kebabCase':
            return (0, _changecase.kebabCase)(name);
        case 'camelCase':
            return (0, _changecase.camelCase)(name);
        case 'snakeCase':
            return (0, _changecase.snakeCase)(name);
        case 'pascalCase':
            return (0, _changecase.pascalCase)(name);
    }
}
function configMatches(config, name) {
    // 如果配置了 include（白名单），只处理列表中的组件
    if (config.include) {
        return config.include.includes(name);
    }
    // 如果配置了 exclude（黑名单），排除列表中的组件
    if (config.exclude) {
        return !config.exclude.includes(name);
    }
    // 没有任何过滤器，匹配所有
    return true;
}
function validateConfig(configs) {
    configs.forEach(function(config, index) {
        if (config.include && config.exclude) {
            throw new Error("配置 #".concat(index, " (source: '").concat(config.source, "'): include 和 exclude 不能同时配置。\n") + "请选择其中一个：\n" + "- 使用 include 指定要处理的组件（白名单）\n" + "- 使用 exclude 指定要排除的组件（黑名单）");
        }
    });
}

//# sourceMappingURL=transform.js.map