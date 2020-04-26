![GitHub Workflow Status](https://img.shields.io/github/workflow/status/monken/node-splitly/build?style=flat-square)
![Apache License](https://img.shields.io/badge/license-Apache--2.0-yellow?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=flat-square)

# Splitly

Splits a stream on a new-line character and reassemble it into a stream of line-sized chunks. Zero dependencies with a focus on speed and simplicity.

There are a number of alternatives our there, namely [split](https://github.com/dominictarr/split), [binary-split](https://github.com/maxogden/binary-split) and [split2](https://github.com/mcollina/split2). All of which are significantly slower than this implementation and some have additional dependencies. Splitly extends `stream.Duplex` instead of `stream.Transform` for greater control over memory pressure and speed.

``` js
const splitly = require('splitly');

fs.createReadStream(file)
  .pipe(splitly.createStream())
  .on('data', function (line) {
    // each chunk is a separate line
    // chunks are buffers and are not stripped of the newline character(s)
    const trimmed = line.toString().trim();
  });
```

**Note:** Usage of the `data` event is not recommended in production code and should only be used for strictly synchronous/blocking code. Instead, pipe the output of the stream to another stream capable of propagating back pressure (such as `process.stdout` or a stream that writes to a database or makes an API call).

`splitly` requires the newline character(s) to be defined as a Buffer, unlike other split stream implementations which also accept regular expressions. Additionally, the newline character is not truncated from the chunk passed to the `data` event. The default newline character is `\n`. If you want to split on `/\r?\n/` instead, keep the default newline character and `trim()` the chunk in the data callback.

Internally, the streams maintains a buffer of lines that have been parsed but not yet consumed. The size of this buffer 

# API

## createStream({ newlineChar: Buffer },  DuplexOptions )

* `newlineChar` \<Buffer> **Default:** `Buffer.from('\n')`
* `DuplexOptions` \<Object> **Default:** `{}` passed to `stream.Duplex` constructor

## Custom Newline Character

``` js
const splitly = require('splitly');

const stream = splitly.createStream({
  // split on zero-byte delimited lines, must be provided as Buffer
  newlineChar: Buffer.from('\0'),
});

```

# Benchmark

`/dev/null` is the raw performance of piping the test stream to `/dev/null`. This is the lower boundary of the performance that can be achieved. It also makes sure the file is in the OS file cache. See [./benchmark/index.js](./benchmark/index.ts) for details. Run under NodeJS v10.15.0.

| name | time | stdev |
| -- | -- | -- |
| /dev/null | 3.22  | 1.47 |
| **splitly** | **5.56**  | **4.39** |
| split | 10.33 | 1.39 |
| split2 | 10.75 | 1.54 |
| binary-split | 12.97 | 2.14 |
| byline | 13.38 | 11.99 |
