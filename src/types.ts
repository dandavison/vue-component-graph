type Graph = { parent: string | null; child: string; edgeData: object }[];

export type ProjectComponents = {
  component: ParsedComponent;
  [index: string]: ParsedComponent;
};
