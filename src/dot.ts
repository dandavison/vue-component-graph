const { buildDAG, getNodeDepths } = require("./dag");
const { Edge, Graph } = require("./types");

type Edge = InstanceType<typeof Edge>;
type Graph = InstanceType<typeof Graph>;

// Brewer Dark28
// http://graphviz.org/doc/info/colors.html
const EDGE_COLORS = [
  "#1b9e77",
  "#d95f02",
  "#7570b3",
  "#e7298a",
  "#66a61e",
  "#e6ab02",
  "#a6761d",
  "#666666",
];

function* colorGenerator(): Generator<string> {
  const n = EDGE_COLORS.length;
  var i = 0;
  while (true) {
    yield EDGE_COLORS[i % n];
    i += 1;
  }
}

export function serializeGraph(graph: Graph): string {
  const edges: Edge[] = [];
  const colors = colorGenerator();
  const eventColors = new Map() as Map<string, string>;
  for (let { from, to, attrs } of graph) {
    if (from) {
      var dotAttrs = {};
      let event = (attrs as any).event;
      if (event) {
        if (!eventColors.has(event)) {
          eventColors.set(event, colors.next().value);
        }
        let color = "red";
        dotAttrs = {
          style: "bold",
          constraint: false,
          weight: 0,
          color: `"${eventColors.get(event)}"`,
        };
      } else {
        dotAttrs = {
          style: "bold",
        };
      }
      edges?.push({
        from,
        to,
        attrs: dotAttrs,
      });
    }
  }
  for (let [event, color] of eventColors) {
    let [r, g, b] = [
      color[1] + color[2],
      color[3] + color[4],
      color[5] + color[6],
    ].map((s) => parseInt(s, 16));
    process.stderr.write(
      `${event.padEnd(
        25,
        " "
      )} \x1b[48;2;${r};${g};${b}m               \x1b[0m\n`
    );
  }
  const subgraphs = getSubgraphs(graph);
  return _format(edges, subgraphs);
}

function getSubgraphs(graph: Graph): string[] {
  const dag = buildDAG(graph);
  const depths: Map<string, number> = getNodeDepths(dag);
  const sameRankGroups = new Map() as Map<number, string[]>;

  for (let [node, depth] of depths.entries()) {
    if (!sameRankGroups.has(depth)) {
      sameRankGroups.set(depth, []);
    }
    sameRankGroups.get(depth)?.push(node);
  }

  const subgraphs = [];
  for (let [depth, nodes] of sameRankGroups) {
    nodes = nodes.map((s) => `"${s}"`);
    if (depth == 0) {
      subgraphs.push(`  { rank = source; ${nodes.join("; ")}}`);
    } else {
      subgraphs.push(`  { rank = same; ${nodes.join("; ")}}`);
    }
  }
  return subgraphs;
}

function _format(edges: Edge[], subgraphs: string[]): string {
  const lines = [];
  lines.push("digraph G {");
  lines.push("  ranksep = 1.5");
  lines.push(...subgraphs);
  for (let e of edges) {
    lines.push(`  ${e.from} -> ${e.to} [${_formatAttrs(e.attrs)}]`);
  }
  lines.push("}");
  return lines.join("\n");
}

function _formatAttrs(attrs: object): string {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}
