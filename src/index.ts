import has from "lodash.has";
import get from "lodash.get";
import set from "lodash.set";
import isEqual from "lodash.isEqual";
import isPlainObject from "lodash.isplainobject";
import { inspect } from "util";
import { diff as getDiff, Operation, clone } from "jiff";
import { serialize, parse } from "json8-pointer";
import { FindCallback, OperationOptions, Key, JsonPath, Data, Context, Path, Logger, TrackedOptions } from "./@types";
import { exec } from "child_process";

const CHECK = "\u001b[32;1m✔\u001b[0m"; // Green ✔
const CROSS = "\u001b[31;1m✘\u001b[0m"; // Red ✘
const WARN = "\u001b[33;1mO\u001b[0m"; // Yellow: O

// function log(action: string, willChange: boolean, path: Array<string | number>, oldValue?: any, newValue?: any) {
//   const level = willChange ? "info" : "warn";
//   const title = willChange ? `${action} Key` : `Not ${action} Key`;
//   const old = oldValue !== undefined ? "  Old --> " + inspect(oldValue, { depth: null }) : "";
//   const value = newValue !== undefined ? `${old !== "" ? "\n" : ""}  New --> ${inspect(newValue, { depth: null })}` : "";
//   const name = this.name ? ` in ${this.name}` : "";
//   const infoMessage = `[${title}] ${path.join(".")}${name}`;
//   const debugMessage = `${old}${value}`;
//   this.logger[level](infoMessage);
//   this.logger.debug(debugMessage);
// }

/**
 * Recursivly cleans all empty arrays and objects. Mutates given object.
 * @private
 * @param   {Object|Array} data - Data to clear.
 * @returns {void}
 */
function cleanObject(data: { [key: string]: any | Array<any> }): boolean {
  if (Array.isArray(data)) {
    data.forEach((value, index, array) => {
      if (Array.isArray(value) || isPlainObject(value)) {
        if (!cleanObject(value)) {
          array.splice(index, 1);
        }
      }
    });
    return data.length > 0;
  }

  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value) || isPlainObject(value)) {
      if (!cleanObject(value)) {
        delete data[key];
      }
    }
  });

  return Object.keys(data).length > 0;
}

/**
 * Returns the index of the first element closest to starting position in the array that satisfies the provided testing function. Otherwise -1 is returned.
 * @private
 * @param   {Array}                 array         - Array to find element in.
 * @param   {number}                startPosition - Position to start from. Function tries to find closest element to this position in either direction.
 * @param   {Tracked~FindCallback}  callback      - Callback to execute on each value in the array, taking three arguments: (element, index, array)
 * @returns {number}                              - Position of closest element that satisfies the provided testing function.
 */
function findIndexClosest(array: Array<any>, startPosition: number, callback: FindCallback): number {
  const len = array.length;
  let distance = 1;

  if (len === 0) {
    return -1;
  }

  const position = startPosition > len - 1 ? len : startPosition;

  if (callback(array[position], position, array)) {
    return position;
  }

  while (position + distance < len || position - distance > -1) {
    if (position + distance < len && callback(array[position + distance], position + distance, array)) {
      return position + distance;
    }
    if (position - distance > -1 && callback(array[position - distance], position - distance, array)) {
      return position - distance;
    }
    distance += 1;
  }
  return -1;
}

/**
 * When `exact` option is false (default), returns the index of the first element closest to starting position with given value.
 * When `exact` option is true, returns index if element at starting position is equal to given value.
 * Compares values with deep comparison. If value cannot be found returns -1.
 * @private
 * @param   {Array<*>}  array           - Array to find element in.
 * @param   {number}    startPosition   - Position to start from. Function tries to find closest element to this position in either direction.
 * @param   {*}         value           - Value to deeply compare array elements to.
 * @param   {boolean}   exact           - If true, function looks only value at starting point and returns it's index if found. If false, function searches whole array.
 * @returns {number}                    - Index position of the found element, -1 otherwise.
 */
function findIndex(array: Array<any>, startPosition: number, value: any, exact: boolean): number {
  if (exact) {
    return isEqual(array[startPosition], value) ? startPosition : -1;
  }
  return findIndexClosest(array, startPosition, e => isEqual(e, value));
}

/**
 * Returns key, parent path and array of parent path of given path.
 * @private
 * @param   {string} path                                     - Path to get parent of.
 * @returns {{key: Key, path: string, pathArray: Array<Key>}} - Key and parent path.
 */
function getParentPath(path: string): { key: Key; path: string; pathArray: Key[] } {
  const arrayPath = parse(path);
  const parentPath = arrayPath.slice(0, -1);
  const key = arrayPath[arrayPath.length - 1];
  const index = Number.isInteger(parseInt(key, 10)) ? parseInt(key, 10) : undefined;
  return { key: index || key, path: parentPath.length > 0 ? serialize(parentPath) : "/", pathArray: parentPath };
}

/**
 * Returns detailed context info for the given object and path
 * @private
 * @param   {Object}    data  - Data object to get detailed info from.
 * @param   {string}    path  - Path to get data for.
 * @returns {Context}         - Context info for the given object and path.
 */
function context(data: object, path: string): Context {
  const parent = getParentPath(path);
  const target = parent.pathArray.length > 0 ? get(data, parent.pathArray) : data;
  const value = typeof target === "object" ? target[parent.key] : undefined;
  const has = typeof target === "object" ? parent.key in target : false;
  const type = target ? (Array.isArray(target) ? "array" : typeof target) : typeof parent.key === "number" ? "array" : "object";

  return { ...parent, target, value, has, type };
}

/**
 * Adds given value to given path.
 * @private
 * @param   {Object}          data          - Data object to modify.
 * @param   {string}          historyPath   - Path to add value.
 * @param   {*}               historyValue  - Value to add.
 * @param   {OperationOptions}  options       - Options.
 * @returns {boolean}                       - Whether operation is executed.
 */
function add(data: object, historyPath: string, historyValue: any, { exact, checkDuplicate, force }: OperationOptions): boolean {
  const { target, key, value, pathArray, has, type } = context(data, historyPath);
  if (type === "array") {
    if (target && checkDuplicate && findIndex(target as Array<any>, key as number, historyValue, exact) > -1) {
      return false;
    }

    const assuredExistingTarget = target || [];
    if (!target) {
      if (!force) {
        return false;
      }
      set(data, pathArray, assuredExistingTarget);
    }

    const targetIndex = Math.min(key as number, assuredExistingTarget.length);
    assuredExistingTarget.splice(targetIndex, 0, historyValue);
    return true;
  }
  if (type === "object" && (force || !has)) {
    set(data, pathArray.concat(key), historyValue);
    return true;
  }
  return false;
}

/**
 * Renoves given value from given path. By default it does not remove element if it is not equal to given value.
 * @private
 * @param   {Object}          data          - Data object to modify.
 * @param   {string}          historyPath   - Path to value to be removed.
 * @param   {*}               historyValue  - Value to remove.
 * @param   {OperationOptions}  options       - Options.
 * @returns {boolean}                       - Whether operation is executed.
 */
function remove(data: object, historyPath: string, historyValue: any, { exact, force }: OperationOptions): boolean {
  const { target, key, value, pathArray, has, type } = context(data, historyPath);

  if (!has) {
    return true; // It is already deleted
  }

  if (Array.isArray(target)) {
    const index = findIndex(target as Array<any>, key as number, historyValue, exact);
    const logIndex = index === -1 ? key : index;
    if (index > -1) {
      target.splice(index, 1);
    }
    return index > -1;
  }

  if (typeof target === "object" && (force || isEqual(value, historyValue))) {
    delete target[key];
    return true;
  }

  return false;
}

/**
 * Replaces given value from given path. By default it does not replcae element if it is not equal to given old value.
 * @private
 * @param   {Object}          data          - Data object to modify.
 * @param   {string}          historyPath   - Path to value to be replaced.
 * @param   {*}               oldValue      - Old value to replace.
 * @param   {*}               newValue      - New value to add.
 * @param   {OperationOptions}  options       - Options.
 * @returns {boolean}                       - Whether operation is executed.
 */
function replace(
  data: object,
  historyPath: string,
  oldValue: any,
  newValue: any,
  { exact, checkDuplicate, force, addNotFound }: OperationOptions,
): boolean {
  const { target, key, value, pathArray, has, type } = context(data, historyPath);

  if (!has && !force && !addNotFound) {
    return false;
  }

  /* istanbul ignore next */
  if (type === "array") {
    const dataIndex = findIndex(target as Array<any>, key as number, oldValue, exact);
    const logIndex = dataIndex === -1 ? key : dataIndex;

    if (force && dataIndex === -1) {
      return add(data, historyPath, newValue, { exact, checkDuplicate, force });
    }
    if (checkDuplicate && findIndex(target as Array<any>, key as number, newValue, false) > -1) {
      return false;
    }
    if (dataIndex > -1 && Array.isArray(target)) {
      target.splice(dataIndex, 1, newValue);
    }
    return dataIndex > -1;
  }

  /* istanbul ignore else */
  if (type === "object") {
    if (force || isEqual(oldValue, value) || (!has && addNotFound)) {
      set(data, pathArray.concat(key), newValue);
      return true;
    }
  }

  return false;
}

/**
 * Resets given object to its original satate using given array of operations. Different from [JSON Patch](http://jsonpatch.com/) standard, uses more relaxed rules.
 * For example rejected operations does stop further execution, values to be replaced in arrays are searched in different index positions etc.
 * Please note: This function mutates `data` object.
 * @param   {Object}                      data                          - Data to be reset.
 * @param   {Array<Operation>}            history                       - Array of operations to execute.
 * @param   {OperationOptions}              [options]                     - Options
 * @param   {boolean}                     [options.force=false]         - Forces operation even it is not safe.
 * @param   {boolean}                     [options.exact=false]         - Modifies find algorithm for arrays. If true, function searches given value in given exact position. Otherwise searches all array.
 * @param   {boolean}                     [options.checkDuplicate=true] - Checks duplicate values in array. If true,  when duplicate value is present, add/replace operation is skipped.
 * @param   {boolean}                     [options.addNotFound=true]    - If true, during replace, adds given value even replaced key is not present in array or object.
 * @param   {boolean}                     [options.clean=true]          - If true, removes empty objects, empty arrays, empty strings, null and undefined values from objects and arrays.
 * @returns {Array<Operation>|undefined}                                - Returns array of operations which are skipped, `undefined` if all operations are applied.
 */
export function reset(
  data: object,
  history: Operation[],
  { exact = false, checkDuplicate = true, force = false, addNotFound = true, clean = true, logger, name }: TrackedOptions = {},
): Operation[] | undefined {
  let oldValue: any;
  const remaining: Operation[] = [];

  history.forEach(operation => {
    let executed =
      operation.op === "replace" && replace(data, operation.path, oldValue, operation.value, { exact, checkDuplicate, force, addNotFound });
    executed = executed || (operation.op === "add" && add(data, operation.path, operation.value, { exact, checkDuplicate, force }));
    executed = executed || (operation.op === "remove" && remove(data, operation.path, oldValue, { exact, force }));

    if (operation.op === "test") {
      oldValue = operation.value;
    } else if (!executed) {
      remaining.push(operation);
    }

    if (logger) {
      const mark = executed ? CHECK : WARN;
      const method = executed ? logger.info : logger.warn;
      const logName = name ? ` of ${name}` : "";
      method(`${mark} \u001b[4m${operation.op}\u001b[0m during reset path "${operation.path}"${logName}`);
    }
  });

  if (clean) {
    cleanObject(data);
  }

  return remaining;
}
/**
 * Compares two objects and returns operations needed to reset current object into original object.
 * @param   {object} currentObject  - Object to be used in `reset` function.
 * @param   {object} originalObject - Original object to get after reset operation.
 * @returns {Array<Operation>}      - Array of operations to apply to current object to get original object.
 */
export function diff(currentObject: object, originalObject: object): Operation[] {
  return getDiff(currentObject, originalObject, { invertible: true });
}

/**
 * Checks whether value at given path is safe to change by comparing cuurent object to original object. May be used to
 * test whether values in given path are created/modified by user and safe to change. Like "in" operator, returns true
 * if there is no entry for given path. However, differently, it returns true if value exist in modified object but
 * it is different from original, assuming it is modified using this library and may be cahnged further.
 * lik
 * @param   {object}                              currentObject   - Current object.
 * @param   {object}                              originalObject  - Original object.
 * @param   {Array<string|number>|string|number}  path            - Path to get result for.
 * @returns {boolean}                                             - Whether given path has same value as original path.
 */
export function mayChange(currentObject: object, originalObject: object, path: Path): boolean {
  const hasA = has(currentObject, path);
  const hasB = has(originalObject, path);
  const changed = hasA !== hasB || !(hasA && hasB && isEqual(get(currentObject, path), get(originalObject, path)));
  const notExists = !hasA && !hasB;
  return changed || notExists;
}

export { Path, TrackedOptions };
