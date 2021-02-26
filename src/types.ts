type Edge = {
  from: string | null; // root has no parent
  to: string;
  attrs: object;
};

type Graph = Edge[];

export type ProjectComponents = {
  component: ParsedComponent;
  [index: string]: ParsedComponent;
};
