"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => transformImportDeclarationPlugin
});
module.exports = __toCommonJS(index_exports);
var t = __toESM(require("@babel/types"));

// src/transform.ts
var import_change_case = require("change-case");
function transformFilename(name, caseType) {
  switch (caseType) {
    case "kebabCase":
      return (0, import_change_case.kebabCase)(name);
    case "camelCase":
      return (0, import_change_case.camelCase)(name);
    case "snakeCase":
      return (0, import_change_case.snakeCase)(name);
    case "pascalCase":
      return (0, import_change_case.pascalCase)(name);
  }
}
function configMatches(config, name) {
  if (config.include) {
    return config.include.includes(name);
  }
  if (config.exclude) {
    return !config.exclude.includes(name);
  }
  return true;
}
function validateConfig(configs) {
  configs.forEach((config, index) => {
    if (config.include && config.exclude) {
      throw new Error(
        `\u914D\u7F6E #${index} (source: '${config.source}'): include \u548C exclude \u4E0D\u80FD\u540C\u65F6\u914D\u7F6E\u3002
\u8BF7\u9009\u62E9\u5176\u4E2D\u4E00\u4E2A\uFF1A
- \u4F7F\u7528 include \u6307\u5B9A\u8981\u5904\u7406\u7684\u7EC4\u4EF6\uFF08\u767D\u540D\u5355\uFF09
- \u4F7F\u7528 exclude \u6307\u5B9A\u8981\u6392\u9664\u7684\u7EC4\u4EF6\uFF08\u9ED1\u540D\u5355\uFF09`
      );
    }
  });
}

// src/index.ts
function transformImportDeclarationPlugin() {
  return {
    name: "transform-import-declaration",
    visitor: {
      Program: {
        enter(_, state) {
          const config = state.opts;
          if (!config || !config.config) {
            throw new Error("Missing plugin configuration");
          }
          validateConfig(config.config);
        }
      },
      ImportDeclaration(path, state) {
        const config = state.opts;
        const node = path.node;
        if (node.importKind === "type") {
          return;
        }
        const source = node.source.value;
        const matchingConfigs = config.config.filter((c) => c.source === source);
        if (matchingConfigs.length === 0) {
          return;
        }
        const namedImports = node.specifiers.filter(
          (spec) => spec.type === "ImportSpecifier" && spec.importKind !== "type"
        );
        if (namedImports.length === 0) {
          return;
        }
        const unprocessedSpecifiers = node.specifiers.filter(
          (spec) => spec.type !== "ImportSpecifier" || spec.importKind === "type"
        );
        const newImports = [];
        namedImports.forEach((specifier) => {
          const importedName = specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value;
          const localName = specifier.local.name;
          let matchedConfig = null;
          for (const cfg of matchingConfigs) {
            if (configMatches(cfg, importedName)) {
              matchedConfig = cfg;
              break;
            }
          }
          if (!matchedConfig) {
            unprocessedSpecifiers.push(specifier);
            return;
          }
          const filename = transformFilename(importedName, matchedConfig.filename);
          const paths = matchedConfig.output.map(
            (template) => template.replace(/\{\{\s*filename\s*\}\}/g, filename)
          );
          const specifierType = matchedConfig.specifier || "default";
          if (paths.length > 0) {
            const mainPath = paths[0];
            switch (specifierType) {
              case "default":
                newImports.push(
                  t.importDeclaration(
                    [t.importDefaultSpecifier(
                      t.identifier(localName)
                    )],
                    t.stringLiteral(mainPath)
                  )
                );
                break;
              case "named":
                newImports.push(
                  t.importDeclaration(
                    [t.importSpecifier(
                      t.identifier(localName),
                      t.identifier(importedName)
                    )],
                    t.stringLiteral(mainPath)
                  )
                );
                break;
              case "namespace":
                newImports.push(
                  t.importDeclaration(
                    [t.importNamespaceSpecifier(
                      t.identifier(localName)
                    )],
                    t.stringLiteral(mainPath)
                  )
                );
                break;
            }
          }
          for (let i = 1; i < paths.length; i++) {
            newImports.push(
              t.importDeclaration(
                [],
                t.stringLiteral(paths[i])
              )
            );
          }
        });
        if (unprocessedSpecifiers.length === 0) {
          path.replaceWithMultiple(newImports);
        } else {
          node.specifiers = unprocessedSpecifiers;
          path.insertAfter(newImports);
        }
      }
    }
  };
}
