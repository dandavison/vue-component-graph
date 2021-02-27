#!/usr/bin/env node

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const readDirTree = require("recursive-readdir");

var { Graph } = require("./types");
type Graph = InstanceType<typeof Graph>;

const rootComponentPath = process.argv[2];

if (!rootComponentPath) {
  console.error(`usage: vue-component-graph RootComponent.vue`);
  console.log("Process received arguments:", process.argv);
  process.exit(1);
}

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

type EventPeers = Map<string, string[]>;

// The graph we create is a sort of union/superposition of two graphs:
// 1. The component DAG: In this DAG there is an edge from
//    component A to component B if B is a child component of A
//    (B occurs in A's DOM subtree and A might pass B props).
//    rootComponent has no parent in the DAG.
// 2. The event graph: in this graph there is an edge from B to A if B emits an
//    event of a type which A handles.
function createGraph(components: ProjectComponents): Graph {
  const root = getComponentName(rootComponentPath);
  const graph: Graph = [];
  graph.push({
    from: null,
    to: root,
    attrs: {},
  });
  addDAGEdgesToGraph(root, graph, components);

  const events = {
    emitters: new Map() as EventPeers,
    handlers: new Map() as EventPeers,
  };
  for (let [name, parsed] of Object.entries(components)) {
    for (let ev of parsed.emittedEvents) {
      if (!events.emitters.has(ev)) {
        events.emitters.set(ev, []);
      }
      events.emitters.get(ev)?.push(name);
    }
    for (let ev of parsed.handledEvents) {
      if (!events.handlers.has(ev)) {
        events.handlers.set(ev, []);
      }
      events.handlers.get(ev)?.push(name);
    }
  }

  for (let [ev, peers] of events.emitters.entries()) {
    for (let from of peers) {
      for (let to of events.handlers.get(ev) || []) {
        graph.push({ from, to, attrs: { event: ev } });
      }
    }
  }

  return graph;
}

function _collectEventPeers(events: EventPeers) {}

function addDAGEdgesToGraph(
  root: string,
  graph: Graph,
  components: ProjectComponents
) {
  for (let child of components[root].components) {
    graph.push({ from: root, to: child, attrs: {} });
    addDAGEdgesToGraph(child, graph, components);
  }
}

const { serializeGraph } = require("./dot");

function writeGraph(graph: string): void {
  process.stdout.write(graph);
}

const rootDir = path.dirname(rootComponentPath);

findComponents(rootDir)
  .then(readComponents)
  .then(parseComponents)
  .then(createGraph)
  .then(serializeGraph)
  .then(writeGraph);
