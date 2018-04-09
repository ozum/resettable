/**
 * @callback Tracked~FindCallback
 * @private
 * @param   {*}           any       - The current element being processed in the array.
 * @param   {number}      [index]   - The index of the current element being processed in the array.
 * @param   {Array<any>}  array     - The array find was called upon.
 * @returns {boolean}               - Whether given element passes the test.
 */
export type FindCallback = (element: any, index?: number, array?: Array<any>) => boolean;

/**
 * Type for options.
 * @private
 * @typedef {Object} OperationOptions
 * @property {boolean}  force           - Forces operation even it is not safe.
 * @property {boolean}  exact           - Modifies find algorithm for arrays. If true, function searches given value in given exact position. Otherwise searches all array.
 * @property {boolean}  checkDuplicate  - Checks duplicate values in array. If true,  when duplicate value is present, add/replace operation is skipped.
 * @property {boolean}  addNotFound     - If true, during replace, adds given value even replaced key is not present in array or object.
 * @property {boolean}  clean           - If true, removes empty objects, empty arrays, empty strings, null and undefined values from objects and arrays.
 */
export interface OperationOptions {
  force: boolean;
  exact: boolean;
  checkDuplicate?: boolean;
  addNotFound?: boolean;
}

export interface TrackedOptions {
  force?: boolean;
  exact?: boolean;
  checkDuplicate?: boolean;
  addNotFound?: boolean;
  clean?: boolean;
  logger?: Logger;
  name?: string;
}

export type Key = number | string;
export type JsonPath = string | number | Array<Key>;
export type Data = { [key: string]: any } | Array<any>;

export interface Logger {
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
  verbose: (message: string) => void;
}

/**
 * Type for storing path of object or array element as a chained string or array.
 * @typedef {string|number|Array<number|string>} Path
 * @example
 * const path = 'member.name'; // { member: { name: ... } }
 * const other = ['member', 'first.name']; // { member: { "first.name": ... } }
 */
export type Path = string | number | Array<string | number>;

/**
 * Type for storing context details for given path.
 * @typedef {Object} Context
 * @private
 * @property {boolean}        has       - Whether given path has an entry. (To differentiate it from undefined value.)
 * @property {Data}           target    - Target object which key belongs to.
 * @property {Key}            key       - Object property name or array index of given path.
 * @property {*}              value     - Value stored in given path.
 * @property {string}         path      - Parent path of the given path as JSON path.
 * @property {Array<string>}  pathArray - Parent path of the given path as array.
 * @property {string}         type      - Type of the target. ("array", "object" etc.)
 */
export type Context = {
  target: Data;
  key: Key;
  has: boolean;
  value: any;
  path: string;
  pathArray: Key[];
  type: string;
};

/**
 * Type for storing operations.
 * @typedef {Object} Operation
 * @property {string} op    - Operation to execte: `test`, `remove`, `add` , `replace`. (`test` checks the existence of value at given path).
 * @property {string} path  - Path to make changes at.
 * @property {*}      value - Value to be used in operation.
 */

const docMe = 1;
