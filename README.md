![Build Status](https://img.shields.io/circleci/build/github/monken/node-splitstream)
![Apache License](https://img.shields.io/badge/license-Apache--2.0-yellow)
![Dependencies](https://img.shields.io/badge/dependencies-0-blue)

# SplitStream

Split a stream on a new-line character and reassemble it into line-sized chunks. Zero dependencies with a focus on speed and simplicity.

There are a number of alternatives our there, namely [split](https://github.com/dominictarr/split), [binary-split](https://github.com/maxogden/binary-split) and [split2](https://github.com/mcollina/split2). All of which are significantly slower than this implementation (~50% faster than `split2`, see [Benchmark](#benchmark)) and some have additional dependencies. SplitStream extends `stream.Duplex` instead of `stream.Transform` for greater control over memory pressure and speed.

``` js
const splitstream = require('split-stream');

fs.createReadStream(file)
  .pipe(splitstream.createStream())
  .on('data', function (line) {
    // each chunk is a separate line
    // chunks are buffers and are not stripped of the newline character(s)
    const trimmed = line.toString().trim();
  });
```

**Note:** Usage of the `data` event is not recommended in production code and should only be used for strictly synchronous/blocking code. Instead, pipe the output of the stream to another stream capabable of propagating back pressure (such as `process.stdout` or a stream that writes to a database or makes an API call).

`splitstream` requires the newline character(s) to be defined as a Buffer, unlike other split stream implementations which also accept regular expressions. Additionally, the newline character is not truncated from the chunk passed to the `data` event. The default newline character is `\n`. If you want to split on `/\r?\n/` instead, keep the default newline character and `trim()` the chunk in the data callback.

Internally, the streams maintains a buffer of lines that have been parsed but not yet consumed. The size of this buffer 

# API

## createStream({ newlineChar: Buffer },  DuplexOptions )

* `newlineChar` \<Buffer> **Default:** `Buffer.from('\n')`
* `DuplexOptions` \<Object> **Default:** `{}` passed to `stream.Duplex` constructor

## Custom Newline Character

``` js
const splitstream = require('split-stream');

const stream = splitstream.createStream({
  // split on zero-byte delimited lines, must be provided as Buffer
  newlineChar: Buffer.from('\0'),
});

```

# Benchmark

`/dev/null` is the raw performance of piping the test stream to `/dev/null`. This is the lower boundary of the performance that can be achieved. It also makes sure the file is in the OS file cache. See [./benchmark/index.js](./benchmark/index.js) for details.

| name | time | stdev |
| -- | -- | -- |
| /dev/null | 3.22  | 1.47 |
| **splitstream** | **5.56**  | **4.39** |
| split2 | 10.75 | 1.54 |
| binary-split | 12.97 | 2.14 |
| byline | 13.38 | 11.99 |
