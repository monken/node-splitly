const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;

const SplitStream = require('../lib');
const byline = require('byline');
const split2 = require('split2');
var binarySplit = require('binary-split');

const hwm = 2 ** 19;

interface Steps {
  [key: string]: Function
}

function str(length: number) {
  return Array.from({ length }, () => 'x').join('');
}

fs.writeFileSync(
  path.join(__dirname, 'input.txt'),
  [Array.from({ length: 5000 }, () => str(Math.ceil(Math.random() * 5000))).join('\n')],
);

function buildBenchmark(createStream: Function) {
  return function run(cb: Function) {
    const input = fs.createReadStream(path.join(__dirname, 'input.txt'), {
      highWaterMark: hwm,
    });
    const stream = createStream();
    let lines = 0;
    stream.on('data', () => { lines += 1; });
    stream.on('end', () => {
      assert.equal(lines, 5000);
      cb();
    });
    if (stream instanceof fs.WriteStream) input.on('end', cb);
    input.pipe(stream);
  };
}

function bench(steps: Steps, count: number): Promise<void> {
  console.log(['name', 'time', 'stdev'].join('\t'));
  const times = new Map();
  return Object.keys(steps).reduce((p, step: string) => {
    const results: Array<number> = [];
    times.set(step, results);
    for (let i = 0; i < count; i += 1) {
      p = p.then(() => new Promise((resolve, reject) => {
        const start = process.hrtime();
        try {
          steps[step]((err?: Error) => {
            if (err) return reject(err);
            const [sec, ns] = process.hrtime(start);
            results.push(Math.ceil(sec * 1000 + ns / 1e6));
            process.nextTick(resolve);
          });
        } catch (e) {
          reject(e);
        }
      }));
    }
    return p.then(() => {
      const avg = results.reduce((a, b) => a + b, 0) / count;
      const stdev = results.map((r) => r - avg).reduce((a, b) => a + b * b, 0) / (count - 1);
      console.log([step, avg.toFixed(2), Math.sqrt(stdev).toFixed(2)].join('\t'));
      // allow the GC to do its thing
      return new Promise((resolve) => setTimeout(resolve, 1000));
    }, (err: Error) => {
      console.log(step, 'failed with', err);
    });
  }, Promise.resolve());
}

bench({
  '/dev/null': buildBenchmark(() => fs.createWriteStream('/dev/null')),
  splitstream: buildBenchmark(() => SplitStream.createStream()),
  split2: buildBenchmark(() => split2()),
  'binary-split': buildBenchmark(() => binarySplit()),
  byline: buildBenchmark(() => byline.createStream()),
}, 200);
