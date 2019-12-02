// eslint-disable-next-line no-unused-vars
import { Duplex, DuplexOptions } from 'stream';

interface Options {
  newlineChar?: Buffer;
}

export class SplitStream extends Duplex {
  private _chunks: Array<Buffer>;

  private _outputBuffer: Array<Buffer | null>;

  private _writeCallback: Function | null;

  private _newlineChar: Buffer;

  private _readableState!: {
    objectMode: boolean;
    sync: boolean;
    needReadable: boolean;
  };

  constructor({ newlineChar }: Options = {}, duplexArgs: DuplexOptions = {}) {
    super(duplexArgs);

    this._chunks = [];
    this._outputBuffer = [];

    this._newlineChar = Buffer.isBuffer(newlineChar)
      ? newlineChar
      : Buffer.from('\n');

    this._writeCallback = null;

    this._readableState.objectMode = true;
    this._readableState.sync = false;
  }

  _write(chunk: Buffer, encoding: string, callback: Function): void {
    let newlinePos = chunk.indexOf(this._newlineChar);
    if (newlinePos === -1) {
      this._chunks.push(chunk);
      callback();
      return;
    }
    let currentChunk = chunk;
    while (newlinePos > -1) {
      this._chunks.push(currentChunk.slice(0, newlinePos + 1));
      const line = Buffer.concat(this._chunks);
      this._outputBuffer.push(line);
      if (this._readableState.needReadable) this._read();
      currentChunk = currentChunk.slice(newlinePos + 1);
      newlinePos = currentChunk.indexOf(this._newlineChar);
      this._chunks = [];
    }
    if (currentChunk.length) this._chunks = [currentChunk];
    this._writeCallback = callback;
  }

  _read() {
    if (!this._outputBuffer.length && this._writeCallback) {
      const cb = this._writeCallback;
      this._writeCallback = null;
      cb();
    }

    while (this._outputBuffer.length) {
      const chunk = this._outputBuffer.shift();
      if (!this.push(chunk)) {
        break;
      }
    }
  }

  _final(callback: Function): void {
    if (this._chunks.length) {
      const line = Buffer.concat(this._chunks);
      this._outputBuffer.push(line);
    }
    this._outputBuffer.push(null);
    if (this._readableState.needReadable) this._read();
    callback();
  }
}

export function createStream(args?: Options) {
  return new SplitStream(args);
}
