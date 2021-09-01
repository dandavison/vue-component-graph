vue-component-graph is a tool to visualize the structure of a Vue codebase as a graph. The graph is created by walking the AST produced by [babel](https://babeljs.io/).

The graph created is a sort of union/superposition of two graphs:

1. The component DAG (black): In this DAG there is an edge from component A to component
   B if B is a child component of A (B occurs in A's DOM subtree and A might
   pass B props).

2. The event graph (red): in this graph there is an edge from B to A if B emits an
   event of a type which A handles.

<table><tr><td><img width=800px src="https://user-images.githubusercontent.com/52205/131735784-b7ac68d7-39f4-46d8-9ad3-122e4b293b11.png" alt="image" /></td></tr></table>

This is work-in-progress. It was created to help me understand my own Vue projects; it's structured as a standard npm package but is not ready to be published.
