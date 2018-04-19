declare module "jiff" {
  export type Operation = { op: "test" | "remove" | "add" | "replace"; path: string; value: any; context?: object };
  export function clone<T extends object>(data: T): T;
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
