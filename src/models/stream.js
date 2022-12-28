const stream = require("stream");

class WritableBufferStream extends stream.Writable {
    constructor(options) {
        super(options);
        this._chunks = [];
    }

    _write(chunk, enc, callback) {
        this._chunks.push(chunk);
        return callback(null);
    }

    _destroy(err, callback) {
        this._chunks = null;
        return callback(null);
    }

    toBuffer() {
        // eslint-disable-next-line no-undef
        return Buffer.concat(this._chunks);
    }
}

module.exports = { WritableBufferStream };
