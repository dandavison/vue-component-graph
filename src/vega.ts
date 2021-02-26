type VegaTreeEdge = {
  id: string;
  parent: string | null;
};

export function formatGraphVega(graph: Graph): string {
  const edges = spec.data[0].values as VegaTreeEdge[];
  for (let { parent, child } of graph) {
    edges?.push({ id: child, parent });
  }
  return formatHTML(spec);
}

const spec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  width: 800,
  height: 600,
  padding: 5,

  signals: [
    {
      name: "method",
      value: "tidy",
      bind: { input: "select", options: ["tidy", "cluster"] },
    },
    { name: "separation", value: true, bind: { input: "checkbox" } },
  ],

  data: [
    {
      name: "tree",
      values: [],
      transform: [
        {
          type: "stratify",
          key: "id",
          parentKey: "parent",
        },
        {
          type: "tree",
          method: { signal: "method" },
          separation: { signal: "separation" },
          size: [{ signal: "width" }, { signal: "height" }],
        },
      ],
    },
    {
      name: "links",
      source: "tree",
      transform: [{ type: "treelinks" }, { type: "linkpath" }],
    },
  ],

  scales: [
    {
      name: "color",
      type: "ordinal",
      range: { scheme: "category20" },
    },
  ],

  marks: [
    {
      type: "path",
      from: { data: "links" },
      encode: {
        enter: {
          stroke: { value: "#ccc" },
        },
        update: {
          path: { field: "path" },
        },
      },
    },
    {
      type: "symbol",
      from: { data: "tree" },
      encode: {
        enter: {
          fill: { scale: "color", field: "id" },
          stroke: { value: "white" },
          size: { value: 400 },
        },
        update: {
          x: { field: "x" },
          y: { field: "y" },
        },
      },
    },
  ],
};

function formatHTML(spec: object): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vue Component Graph</title>
    <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
  </head>
  <body>
    <div id="tree">
    </div>
  </body>
  <script>
    var spec=${JSON.stringify(spec, null, 2)};

    var view = new vega.View(vega.parse(spec), {
      logLevel: vega.Warn,
      renderer: "svg",
    })
      .initialize("#tree")
      .hover()
      .run();
  </script>
</html>
`;
}
