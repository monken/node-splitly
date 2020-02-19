import { expect } from 'chai';
import 'mocha';

// eslint-disable-next-line import/no-unresolved
import { createStream } from '../lib';

interface Test {
  name: string;
  chunks: Array<string | Buffer>;
  lines: Array<string>;
  newlineChar?: Buffer;
}

describe('splitly', () => {
  describe('basic', () => {
    const tests = [{
      name: 'two lines',
      chunks: ['foo\n', 'bar\n'],
      lines: ['foo\n', 'bar\n'],
    }, {
      name: 'two lines as Buffers',
      chunks: ['foo\n', 'bar\n'].map((c) => Buffer.from(c)),
      lines: ['foo\n', 'bar\n'],
    }, {
      name: 'no traling new line',
      chunks: ['foo\nbar\nbar'],
      lines: ['foo\n', 'bar\n', 'bar'],
    }, {
      name: 'no newline in first chunk',
      chunks: ['foobar', 'foo\nbar'],
      lines: ['foobarfoo\n', 'bar'],
    }, {
      name: 'one large chunk',
      chunks: Array.from({ length: 1000 }, (v, a) => `line ${a * 2}\nline ${a * 2 + 1}\n`),
      lines: Array.from({ length: 2000 }, (v, a) => `line ${a}\n`),
    }, {
      name: 'many lines',
      chunks: [Array.from({ length: 2000 }, (v, a) => `line ${a}\n`).join('')],
      lines: Array.from({ length: 2000 }, (v, a) => `line ${a}\n`),
    }, {
      name: '2-char newline with clean break',
      chunks: ['foo\n\n', 'bar'],
      lines: ['foo\n\n', 'bar'],
      newlineChar: Buffer.from('\n\n'),
    }, {
      name: '2-char newline with dirty break',
      chunks: ['foo\n', '\nbar'],
      lines: ['foo\n\n', 'bar'],
      newlineChar: Buffer.from('\n\n'),
    }];

    tests.forEach(({
      chunks, lines, name, newlineChar,
    }: Test) => it(name, (done) => {
      let processed = 0;
      const stream = createStream({
        newlineChar: newlineChar || Buffer.from('\n'),
      });
      stream.on('data', (chunk) => {
        expect(chunk.toString()).to.equal(lines[processed]);
        processed += 1;
      });
      stream.on('end', () => {
        expect(processed).to.equal(lines.length);
        done();
      });
      chunks.forEach((c) => stream.write(c));

      stream.end();
    }));
  });
});
