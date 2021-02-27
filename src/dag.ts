type DAG = Map<string, DAG>;

export function buildDAG(graph: Graph): DAG {
  return _buildDAG(null, new Map(), graph);
}

function _buildDAG(root: string | null, dag: DAG, graph: Graph): DAG {
  for (let { from, to, attrs } of graph) {
    if (attrs.event) {
      continue;
    }
    if (from === root) {
      let subdag = dag.get(to) || new Map();
      dag.set(to, _buildDAG(to, subdag, graph));
    }
  }
  return dag;
}

export function getNodeDepths(dag: DAG): Map<string, number> {
  const depths = new Map() as Map<string, number>;

  function _getNodeDepths(dag: DAG, depth: number): void {
    for (let [child, subdag] of dag.entries()) {
      depths.set(child, Math.max(depth, depths.get(child) || 0));
      _getNodeDepths(subdag, depth + 1);
    }
  }

  _getNodeDepths(dag, 0);

  return depths;
}

export function printDAG(dag: DAG, indent: number = 0): void {
  for (let [child, subdag] of dag.entries()) {
    console.log(`${" ".repeat(indent * 4)}${child}`);
    printDAG(subdag, indent + 1);
  }
}
