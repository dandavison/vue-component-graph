#!/usr/bin/env node

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const readDirTree = require("recursive-readdir");

// TODO: duplicated type definition
type ParsedComponent = {
  components: string[];
  emittedEvents: string[];
  handledEvents: string[];
};

const rootComponentPath = process.argv[2];

if (!rootComponentPath) {
  console.error(`usage: vue-component-graph RootComponent.vue`);
  console.log("Process received arguments:", process.argv);
  process.exit(1);
}

type Graph = Map<string, Graph>;

async function findComponents(rootDir: string): Promise<string[]> {
  var paths: string[] = await readDirTree(rootDir);
  return paths.filter((p) => p.endsWith(".vue"));
}

async function readComponents(
  paths: string[]
): Promise<{ name: string; code: string }> {
  const code = await Promise.all(
    paths.map((p: string) => fs.readFileSync(p, "utf-8"))
  );
  const names = paths.map((p) => path.basename(p, ".vue"));
  if (names.length !== new Set(names).size) {
    console.error("Duplicate component names:", names);
    process.exit(1);
  }
  return _.zipObject(names, code);
}

const { parseComponent } = require("../src/parse-vue-component");

function parseComponents(code: {
  name: string;
  code: string;
}): { name: string; component: ParsedComponent } {
  return _.mapValues(code, parseComponent);
}

function createGraph(components: {
  name: string;
  component: ParsedComponent;
}): Graph {
  const graph = new Map();

  return graph;
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
