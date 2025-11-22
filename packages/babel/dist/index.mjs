// src/index.ts
import * as t from "@babel/types";

// src/transform.ts
import { camelCase, pascalCase, snakeCase, kebabCase } from "change-case";
function transformFilename(name, caseType) {
  switch (caseType) {
    case "kebabCase":
      return kebabCase(name);
    case "camelCase":
      return camelCase(name);
    case "snakeCase":
      return snakeCase(name);
    case "pascalCase":
      return pascalCase(name);
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
        `Config #${index} (source: '${config.source}'): 'include' and 'exclude' cannot be used together.
Please choose one:
- Use 'include' to specify components to process (whitelist)
- Use 'exclude' to specify components to skip (blacklist)`
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
export {
  transformImportDeclarationPlugin as default
};
