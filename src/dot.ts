var { Edge, Graph } = require("./types");
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
  return _format(edges);
}

const SUBGRAPHS = `
  { rank = source; "ChallengeView" }
  { rank = same;  "ControlPanel"; "FamilySelector"; "Challenge"; }
  { rank = same;  "NamesSelector"; "ChallengeForm"; "RevealArea"; "ChallengeDescription"; "ChallengeControls" }
  { rank = same; "ChallengeFormField"; "RecordingPlayer" }
  { rank = same; "ChallengeFormFieldDropdownRow"; "ChallengeFormFieldDropdownRowMobile" }
  `;

function _format(edges: Edge[]): string {
  const lines = [];
  lines.push("digraph G {");
  lines.push("ranksep = 1.5");
  lines.push(SUBGRAPHS);
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
