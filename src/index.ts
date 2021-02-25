#!/usr/bin/env node

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const readDirTree = require("recursive-readdir");

const rootComponentPath = process.argv[2];

if (!rootComponentPath) {
  console.error(`usage: vue-component-graph RootComponent.vue`);
  console.log("Process received arguments:", process.argv);
  process.exit(1);
}

type Graph = { parent: string | null; child: string; edgeData: object }[];

async function findComponents(rootDir: string): Promise<string[]> {
  var paths: string[] = await readDirTree(rootDir);
  return paths.filter((p) => p.endsWith(".vue"));
}

async function readComponents(
  filepaths: string[]
): Promise<{ name: string; code: string }> {
  const code = await Promise.all(
    filepaths.map((p: string) => fs.readFileSync(p, "utf-8"))
  );
  const names = filepaths.map(getComponentName);
  if (names.length !== new Set(names).size) {
    console.error("Duplicate component names:", names);
    process.exit(1);
  }
  return _.zipObject(names, code);
}

function getComponentName(filepath: string): string {
  return path.basename(filepath, ".vue");
}

const {
  parseComponent,
  ParsedComponentValue,
} = require("../src/parse-vue-component");

type ParsedComponent = InstanceType<typeof ParsedComponentValue>;

function parseComponents(code: {
  name: string;
  code: string;
}): { name: string; component: ParsedComponent } {
  return _.mapValues(code, parseComponent);
}

type ProjectComponents = {
  [index: string]: ParsedComponent;
};

// Create tree rooted at rootComponent; do not add edges
// involving components outside this tree
function createGraph(components: ProjectComponents): Graph {
  const root = getComponentName(rootComponentPath);
  const graph = [] as Graph;
  graph.push({
    parent: null,
    child: root,
    edgeData: {},
  });
  addTreeEdgesToGraph(root, graph, components);

  return graph;
}

function addTreeEdgesToGraph(
  root: string,
  graph: Graph,
  components: ProjectComponents
) {
  for (let child of components[root].components) {
    graph.push({ parent: root, child, edgeData: {} });
    addTreeEdgesToGraph(child, graph, components);
  }
}

const { formatGraphVega } = require("../src/vega");

function formatGraph(graph: Graph): string {
  return formatGraphVega(graph);
}

function writeGraph(graph: string): void {
  process.stdout.write(graph);
}

const rootDir = path.dirname(rootComponentPath);

findComponents(rootDir)
  .then(readComponents)
  .then(parseComponents)
  .then(createGraph)
  .then(formatGraph)
  .then(writeGraph);
