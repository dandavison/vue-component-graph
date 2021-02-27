const { buildDAG, getNodeDepths } = require("./dag");
const { Edge, Graph } = require("./types");

type Edge = InstanceType<typeof Edge>;
type Graph = InstanceType<typeof Graph>;

export function serializeGraph(graph: Graph): string {
  const edges: Edge[] = [];
  for (let { from, to, attrs } of graph) {
    if (from) {
      var dotAttrs = {};
      let event = (attrs as any).event;
      if (event) {
        dotAttrs = {
          label: `"${event}"`,
          constraint: false,
          weight: 0,
          color: "red",
          fontcolor: "red",
          style: "dashed",
        };
      }
      edges?.push({
        from,
        to,
        attrs: dotAttrs,
      });
    }
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
