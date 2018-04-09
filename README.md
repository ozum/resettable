<!-- DO NOT EDIT README.md (It will be overridden by README.hbs) -->

# resettable-object

Reset object to its original state using JSON Patch with less strict rules. Maybe used to undo auto generated configuration data.

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

* [Description](#description)
* [Synopsis](#synopsis)
  * [Modify `package.json` file](#modify-packagejson-file)
  * [Reset `package.json` to its original state](#reset-packagejson-to-its-original-state)
* [API](#api)
  * [Functions](#functions)
  * [Typedefs](#typedefs)
  * [reset(data, history, [options]) ⇒ <code>Array.&lt;Operation&gt;</code> \| <code>undefined</code>](#resetdata-history-options-%E2%87%92-codearrayltoperationgtcode-%5C-codeundefinedcode)
  * [diff(currentObject, originalObject) ⇒ <code>Array.&lt;Operation&gt;</code>](#diffcurrentobject-originalobject-%E2%87%92-codearrayltoperationgtcode)
  * [mayChange(currentObject, originalObject, path) ⇒ <code>boolean</code>](#maychangecurrentobject-originalobject-path-%E2%87%92-codebooleancode)
  * [Path : <code>string</code> \| <code>number</code> \| <code>Array.&lt;(number\|string)&gt;</code>](#path--codestringcode-%5C-codenumbercode-%5C-codearrayltnumber%5Cstringgtcode)
  * [Operation : <code>Object</code>](#operation--codeobjectcode)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Description

Provide functions to get diff of two objects and use that diff to reset object into its original state. Uses less strict rules than JSON Patch. Maybe used to undo auto generated configuration data.

# Synopsis

## Modify `package.json` file

```js
import { mayChange, diff, reset, clone } from "resettable";
import fs from "fs";
import isEqual from "lodash.isEqual";

const originalPkg = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, "utf8")); // Read package.json
const pkg: any = clone(originalPkg); // Clone it for changes.
pkg.scripts.myScript = "echo 1"; // Add some script.

// Look if scripts.test can be changed safely. (Not same with "test in scripts", See API.)
if (mayChange(pkg, originalPkg, "scripts.test")) {
  pkg.scripts.test = "test-different";
}

const patch = diff(pkg, originalPkg);

fs.writeFileSync(`${__dirname}/../package.json`, JSON.stringify(pkg, undefined, 2)); // Write package.json
fs.writeFileSync(`${__dirname}/../patch.json`, JSON.stringify(patch, undefined, 2)); // Write patch.json
```

## Reset `package.json` to its original state

```js
const pkgFromDisk = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, "utf8")); // Read package.json
const patchFromDisk = JSON.parse(fs.readFileSync(`${__dirname}/../patch.json`, "utf8")); // Read package.json
reset(pkgFromDisk, patchFromDisk);

fs.writeFileSync(`${__dirname}/../package.json`, JSON.stringify(pkgFromDisk, undefined, 2)); // Write package.json
fs.writeFileSync(`${__dirname}/../patch.json`, JSON.stringify({}, undefined, 2)); // Clear patch.json
```

# API

## Functions

<dl>
<dt><a href="#reset">reset(data, history, [options])</a> ⇒ <code><a href="#Operation">Array.&lt;Operation&gt;</a></code> | <code>undefined</code></dt>
<dd><p>Resets given object to its original satate using given array of operations. Different from <a href="http://jsonpatch.com/">JSON Patch</a> standard, uses more relaxed rules.
For example rejected operations does stop further execution, values to be replaced in arrays are searched in different index positions etc.
Please note: This function mutates <code>data</code> object.</p></dd>
<dt><a href="#diff">diff(currentObject, originalObject)</a> ⇒ <code><a href="#Operation">Array.&lt;Operation&gt;</a></code></dt>
<dd><p>Compares two objects and returns operations needed to reset current object into original object.</p></dd>
<dt><a href="#mayChange">mayChange(currentObject, originalObject, path)</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks whether value at given path is safe to change by comparing cuurent object to original object. May be used to
test whether values in given path are created/modified by user and safe to change. Like &quot;in&quot; operator, returns true
if there is no entry for given path. However, differently, it returns true if value exist in modified object but
it is different from original, assuming it is modified using this library and may be cahnged further.
lik</p></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Path">Path</a> : <code>string</code> | <code>number</code> | <code>Array.&lt;(number|string)&gt;</code></dt>
<dd><p>Type for storing path of object or array element as a chained string or array.</p></dd>
<dt><a href="#Operation">Operation</a> : <code>Object</code></dt>
<dd><p>Type for storing operations.</p></dd>
</dl>

<a name="reset"></a>

## reset(data, history, [options]) ⇒ [<code>Array.&lt;Operation&gt;</code>](#Operation) \| <code>undefined</code>

<p>Resets given object to its original satate using given array of operations. Different from <a href="http://jsonpatch.com/">JSON Patch</a> standard, uses more relaxed rules.
For example rejected operations does stop further execution, values to be replaced in arrays are searched in different index positions etc.
Please note: This function mutates <code>data</code> object.</p>

**Kind**: global function  
**Returns**: [<code>Array.&lt;Operation&gt;</code>](#Operation) \| <code>undefined</code> - <ul>

<li>Returns array of operations which are skipped, <code>undefined</code> if all operations are applied.</li>
</ul>  

| Param                    | Type                                               | Default            | Description                                                                                                                              |
| ------------------------ | -------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| data                     | <code>Object</code>                                |                    | <p>Data to be reset.</p>                                                                                                                 |
| history                  | [<code>Array.&lt;Operation&gt;</code>](#Operation) |                    | <p>Array of operations to execute.</p>                                                                                                   |
| [options]                | <code>OperationOptions</code>                      |                    | <p>Options</p>                                                                                                                           |
| [options.force]          | <code>boolean</code>                               | <code>false</code> | <p>Forces operation even it is not safe.</p>                                                                                             |
| [options.exact]          | <code>boolean</code>                               | <code>false</code> | <p>Modifies find algorithm for arrays. If true, function searches given value in given exact position. Otherwise searches all array.</p> |
| [options.checkDuplicate] | <code>boolean</code>                               | <code>true</code>  | <p>Checks duplicate values in array. If true, when duplicate value is present, add/replace operation is skipped.</p>                     |
| [options.addNotFound]    | <code>boolean</code>                               | <code>true</code>  | <p>If true, during replace, adds given value even replaced key is not present in array or object.</p>                                    |
| [options.clean]          | <code>boolean</code>                               | <code>true</code>  | <p>If true, removes empty objects, empty arrays, empty strings, null and undefined values from objects and arrays.</p>                   |

<a name="diff"></a>

## diff(currentObject, originalObject) ⇒ [<code>Array.&lt;Operation&gt;</code>](#Operation)

<p>Compares two objects and returns operations needed to reset current object into original object.</p>

**Kind**: global function  
**Returns**: [<code>Array.&lt;Operation&gt;</code>](#Operation) - <ul>

<li>Array of operations to apply to current object to get original object.</li>
</ul>  

| Param          | Type                | Description                                              |
| -------------- | ------------------- | -------------------------------------------------------- |
| currentObject  | <code>object</code> | <p>Object to be used in <code>reset</code> function.</p> |
| originalObject | <code>object</code> | <p>Original object to get after reset operation.</p>     |

<a name="mayChange"></a>

## mayChange(currentObject, originalObject, path) ⇒ <code>boolean</code>

<p>Checks whether value at given path is safe to change by comparing cuurent object to original object. May be used to
test whether values in given path are created/modified by user and safe to change. Like &quot;in&quot; operator, returns true
if there is no entry for given path. However, differently, it returns true if value exist in modified object but
it is different from original, assuming it is modified using this library and may be cahnged further.
lik</p>

**Kind**: global function  
**Returns**: <code>boolean</code> - <ul>

<li>Whether given path has same value as original path.</li>
</ul>  

| Param          | Type                                                                                      | Description                    |
| -------------- | ----------------------------------------------------------------------------------------- | ------------------------------ |
| currentObject  | <code>object</code>                                                                       | <p>Current object.</p>         |
| originalObject | <code>object</code>                                                                       | <p>Original object.</p>        |
| path           | <code>Array.&lt;(string\|number)&gt;</code> \| <code>string</code> \| <code>number</code> | <p>Path to get result for.</p> |

<a name="Path"></a>

## Path : <code>string</code> \| <code>number</code> \| <code>Array.&lt;(number\|string)&gt;</code>

<p>Type for storing path of object or array element as a chained string or array.</p>

**Kind**: global typedef  
**Example**

```js
const path = "member.name"; // { member: { name: ... } }
const other = ["member", "first.name"]; // { member: { "first.name": ... } }
```

<a name="Operation"></a>

## Operation : <code>Object</code>

<p>Type for storing operations.</p>

**Kind**: global typedef  
**Properties**

| Name  | Type                | Description                                                                                                                                                                   |
| ----- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| op    | <code>string</code> | <p>Operation to execte: <code>test</code>, <code>remove</code>, <code>add</code> , <code>replace</code>. (<code>test</code> checks the existence of value at given path).</p> |
| path  | <code>string</code> | <p>Path to make changes at.</p>                                                                                                                                               |
| value | <code>\*</code>     | <p>Value to be used in operation.</p>                                                                                                                                         |
