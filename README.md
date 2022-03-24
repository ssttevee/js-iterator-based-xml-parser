# Iterator-based XML Parser

A simple, zero-dependency XML parser that uses the [iterator interface](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols).

## Basic Usage

```js
for (const node of parse('<hello>world</hello>')) {
    console.log(node);
    // prints:
    //   { "type": "opentag", "opentag": { "name": "hello", "empty": false, "attributes": {} } }
    //   { "type": "text", "text": "world" }
    //   { "type": "closetag", "closetag": "hello" }
}
```

```js
const res = await fetch('https://www.w3schools.com/xml/note.xml');
for await (const node of parseStream(res.body)) {
    console.log(node);
    // prints:
    //   { "type": "xmldecl", "xmldecl": { "version": "1.0", "encoding": "UTF-8" } }
    //   { "type": "text", "text": "\n" }
    //   { "type": "opentag", "opentag": { "name": "note", "empty": false, "attributes": {} } }
    //   { "type": "text", "text": "\n  " }
    //   { "type": "opentag", "opentag": { "name": "to", "empty": false, "attributes": {} } }
    //   { "type": "text", "text": "Tove" }
    //   { "type": "closetag", "closetag": "to" }
    //   { "type": "text", "text": "\n  " }
    //   { "type": "opentag", "opentag": { "name": "from", "empty": false, "attributes": {} } }
    //   { "type": "text", "text": "Jani" }
    //   { "type": "closetag", "closetag": "from" }
    //   { "type": "text", "text": "\n  " }
    //   { "type": "opentag", "opentag": { "name": "heading", "empty": false, "attributes": {} } }
    //   { "type": "text", "text": "Reminder" }
    //   { "type": "closetag", "closetag": "heading" }
    //   { "type": "text", "text": "\n  " }
    //   { "type": "opentag", "opentag": { "name": "body", "empty": false, "attributes": {} } }
    //   { "type": "text", "text": "Don't forget me this weekend!" }
    //   { "type": "closetag", "closetag": "body" }
    //   { "type": "text", "text": "\n" }
    //   { "type": "closetag", "closetag": "note" }
}
```

## Advanced Usage

```js
const p = new Parser();
p.write('<hello>wor');
for (const node of p) {
    console.log(node);
    // prints:
    //   { "type": "opentag", "opentag": { "name": "hello", "empty": false, "attributes": {} } }
}
p.write('ld</hello>asdf');
for (const node of p) {
    console.log(node);
    // prints:
    //   { "type": "text", "text": "world" }
    //   { "type": "closetag", "closetag": "hello" }
}
p.close();
for (const node of p) {
    console.log(node);
    // prints:
    //   { "type": "text", "text": "asdf" }
}
```

## Importing

### NodeJS

```sh
npm install @ssttevee/xml-parser
```

```js
import { Parser, parse, parseStream } from '@ssttevee/xml-parser';
```

### Deno

```ts
import { Parser, parse, parseStream } from 'https://raw.githubusercontent.com/ssttevee/xml-parser/trunk/mod.ts';
```

OR

```ts
// @deno-types="https://unpkg.com/@ssttevee/xml-parser/index.d.js"
import { Parser, parse, parseStream } from "https://unpkg.com/@ssttevee/xml-parser/index.js";
```
