#!/usr/bin/env node

const babel = require("@babel/core");
const vueCompiler = require("vue-template-compiler");
const fs = require("fs");

const filename = process.argv[2];
const componentCode = fs.readFileSync(filename, "utf-8");
const parsedComponent = vueCompiler.parseComponent(componentCode);
const template = parsedComponent?.template?.content;
const scriptCode = parsedComponent?.script?.content;
if (!(template && scriptCode)) {
  console.error("Failed to parse .vue component file");
  process.exit(1);
}
const compiledTemplate = vueCompiler.compile(template);
const templateAST = compiledTemplate.ast;
const templateCode = compiledTemplate.render;

const scriptAST = require("@babel/parser").parse(scriptCode, {
  sourceType: "module",
  plugins: ["typescript"],
});

const components: string[] = [];
const emittedEvents: string[] = [];

const componentsIdentifierVisitor = {
  Identifier: {
    enter({ node }: any) {
      // TODO: collect `components` object key names only
      if (node.name !== "components") {
        components.push(node.name);
      }
    },
  },
};

const output = babel.transformFromAstSync(scriptAST, scriptCode, {
  filename,
  plugins: [
    function ComponentGraph() {
      return {
        visitor: {
          Identifier(path: any) {
            if (path.isIdentifier({ name: "components" })) {
              path.parentPath.traverse(componentsIdentifierVisitor);
            } else if (path.node.name.includes("emit")) {
              let gparentPath = path.parentPath.parentPath;
              if (gparentPath.isCallExpression()) {
                emittedEvents.push(gparentPath.node.arguments[0].value);
              }
            }
          },
        },
      };
    },
  ],
});

// TODO: nodes are being visited twice
console.log("components:", new Set(components));
console.log("emittedEvents:", new Set(emittedEvents));
