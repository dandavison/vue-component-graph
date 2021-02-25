const spec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  width: 200,
  height: 100,
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
      values: [
        { id: "A", parent: null },
        { id: "B", parent: "A" },
        { id: "C", parent: "A" },
        { id: "D", parent: "C" },
        { id: "E", parent: "C" },
      ],
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

export function formatGraphVega(graph: Graph): string {
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
    var spec=${JSON.stringify(spec)};
    function image(view, type) {
      return function (event) {
        event.preventDefault();
        view
          .toImageURL(type)
          .then(function (url) {
            var link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("target", "_blank");
            link.setAttribute("download", "tree." + type);
            link.dispatchEvent(new MouseEvent("click"));
          })
          .catch(function (error) {
            console.error(error);
          });
      };
    }

    var view = new vega.View(vega.parse(spec), {
      loader: vega.loader({ baseURL: "/vega/" }),
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
