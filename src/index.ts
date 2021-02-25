#!/usr/bin/env node
const babel = require("@babel/core");
const fs = require("fs");

const filename = process.argv[2];
const code = fs.readFileSync(filename, "utf-8");
const ast = require("@babel/parser").parse(code, {
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

const output = babel.transformFromAstSync(ast, code, {
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
