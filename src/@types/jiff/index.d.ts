declare module "jiff" {
  type Operation = { op: "test" | "remove" | "add" | "replace"; path: string; value: any; context?: object };
  export function clone(data: object): object;
  export function diff(
    a: object,
    b: object,
    {
      hash,
      makeContext,
      invertible,
    }: { hash?: (data: any) => string | number; makeContext?: (index: number, array: Array<any>) => number; invertible?: boolean },
  ): Operation[];
}
