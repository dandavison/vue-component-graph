const _ = require("lodash");
const babel = require("@babel/core");
const vueCompiler = require("vue-template-compiler");

export type ParsedComponent = {
  components: string[];
  emittedEvents: string[];
  handledEvents: string[];
};

const IGNORED_EVENTS = ["focus", "blur", "click", "input"];

export function parseComponent(componentCode: string): ParsedComponent {
  const parsedComponent = vueCompiler.parseComponent(componentCode);
  const template = parsedComponent?.template?.content;
  const scriptCode = parsedComponent?.script?.content;
  if (template === undefined || scriptCode === undefined) {
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

  // TODO: nodes are being visited twice hence Set for deduplication
  const components: Set<string> = new Set();
  const emittedEvents: Set<string> = new Set();
  const handledEvents: Set<string> = new Set();

  const componentsIdentifierVisitor = {
    Identifier: {
      enter({ node }: any) {
        // TODO: collect `components` object key names only
        if (node.name !== "components") {
          components.add(node.name);
        }
      },
    },
  };

  babel.transformFromAstSync(scriptAST, scriptCode, {
    filename: "",
    plugins: [
      function ComponentGraph() {
        return {
          visitor: {
            Identifier(path: any) {
              if (path.isIdentifier({ name: "components" })) {
                path.parentPath.traverse(componentsIdentifierVisitor);
              } else if (path.node.name === "$emit") {
                let gparentPath = path.parentPath.parentPath;
                if (gparentPath.isCallExpression()) {
                  emittedEvents.add(gparentPath.node.arguments[0].value);
                }
              } else if (path.node.name === "$on") {
                let gparentPath = path.parentPath.parentPath;
                if (gparentPath.isCallExpression()) {
                  handledEvents.add(gparentPath.node.arguments[0].value);
                }
              }
            },
          },
        };
      },
    ],
  });

  // TODO: What is the correct way to traverse the AST obtained from the template code?
  function visitTemplateASTNode(node: any): void {
    for (let name of Object.keys(node.events || {})) {
      handledEvents.add(name);
    }
    for (let { value } of node.attrsList || []) {
      let match = value.match("\\$emit\\(([^)]+)\\)");
      if (match && match[1]) {
        emittedEvents.add(match[1].slice(1, -1));
      }
    }
    for (let entry of node.ifConditions || []) {
      for (let child of entry.block?.children || []) {
        visitTemplateASTNode(child);
      }
    }
    for (let child of node.children || []) {
      visitTemplateASTNode(child);
    }
  }

  visitTemplateASTNode(templateAST);

  for (let name of IGNORED_EVENTS) {
    emittedEvents.delete(name);
    handledEvents.delete(name);
  }

  ///////////////////////////////////////////
  // TMP
  for (let name of emittedEvents) {
    if (name.startsWith("settings:")) {
      emittedEvents.delete(name);
      emittedEvents.add("change:settings");
    }
  }
  for (let name of handledEvents) {
    if (name.startsWith("settings:")) {
      handledEvents.delete(name);
      handledEvents.add("change:settings");
    }
  }
  ///////////////////////////////////////////

  return _.mapValues(
    { components, emittedEvents, handledEvents },
    (x: Set<string>) => Array.from(x)
  );
}
