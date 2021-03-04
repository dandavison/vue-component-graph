const { serializeGraph: serializeGraphAsDot } = require("./dot");

export function serializeGraph(graph: Graph): string {
  return `<!DOCTYPE html>
<meta charset="utf-8" />
<body>
  <script src="https://d3js.org/d3.v4.min.js"></script>
  <script src="http://viz-js.com/bower_components/viz.js/viz-lite.js"></script>
  <script src="https://github.com/magjac/d3-graphviz/releases/download/v0.0.4/d3-graphviz.min.js"></script>
  <div id="graph" style="text-align: center"></div>
  <script>
    d3.select("#graph").graphviz().renderDot(\`${serializeGraphAsDot(graph)}\`);
  </script>
</body>`;
}
