declare module "json8-pointer" {
  export function context(doc: object, path: string | string[]): [string, object | Array<any>];
  export function find(doc: object, path: string): any;
  export function parse(path: string | number): Array<string>;
  export function decode(path: string): Array<string>;
  export function serialize(path: Array<string | number>): string;
  export function encode(path: Array<string>): string;
}
