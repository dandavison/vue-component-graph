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

const { parseComponent } = require("../lib/parse-vue-component");

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
): Promise<{ path: string; code: string }> {
  const components = await Promise.all(
    paths.map((p: string) => fs.readFileSync(p, "utf-8"))
  );
  return _.zipObject(paths, components);
}

function parseComponents(code: {
  path: string;
  code: string;
}): { path: string; component: ParsedComponent } {
  return _.mapValues(code, parseComponent);
}

function createGraph(components: {
  path: string;
  component: ParsedComponent;
}): Graph {
  console.log(components);
  return new Map();
}

function writeGraph(graph: Graph) {
  console.log("<write-graph>");
}

const rootDir = path.dirname(rootComponentPath);

findComponents(rootDir)
  .then(readComponents)
  .then(parseComponents)
  .then(createGraph)
  .then(writeGraph);
