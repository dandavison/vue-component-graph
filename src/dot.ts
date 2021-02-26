type Edge = {
  from: string;
  to: string;
  attrs: object;
};

export function formatGraphDot(graph: Graph): string {
  const edges: Edge[] = [];
  for (let { parent, child } of graph) {
    if (parent) {
      edges?.push({ from: parent, to: child, attrs: {} });
    }
  }
  return _format(edges);
}

function _format(edges: Edge[]): string {
  const lines = [];
  lines.push("digraph G {");
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
