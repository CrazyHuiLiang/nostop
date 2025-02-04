const EventEmitter = require('events');
const stream = require('stream');

// 换行符
const new_l_b = Buffer.from('\r\n', 'utf-8');

// 获取 pattern_buf 在 buf 中出现的位置
function *indexesOf(buf, pattern_buf) {
    let j=0;
    for (let i = 0; i<buf.length; i++) {
        for (j=0; j<pattern_buf.length; j++) {
            const c1 = buf[i+j];
            const c2 = pattern_buf[j];
            if (c1 !== c2) {
                break;
            }
        }
        if (j === pattern_buf.length) {
            yield i;
        }
    }
}

function simpleMutipartParser(body, boundary) {
    const boundary_b = Buffer.from(boundary, 'utf-8');
    const hyphens_b = Buffer.from('--', 'utf-8');
    const delimiter = Buffer.concat([hyphens_b, boundary_b]);

    const indexes = [...indexesOf(body, delimiter)];
    console.log('indexes', {
        delimiter: delimiter.toString('utf8'), body: body.toString('utf8'), indexes
    });

    const body_parts = [];
    for (let i=0; i<indexes.length-1; i++) {
        const start = indexes[i] + delimiter.length + new_l_b.length;
        const end = indexes[i+1] - new_l_b.length;
        const part = body.subarray(start, end);
        // const part_s = part.toString();
        // log('-------\n', part_s);
        body_parts.push(part);
    }
    console.log('body_parts', body_parts)

    const body_parsed = body_parts.map(part => {
        const header_delimiter = Buffer.concat([new_l_b, new_l_b]);
        const start_with_blank_l = indexesOf(part, new_l_b).next().value;
        const delimiter_index = indexesOf(part, header_delimiter).next().value;
        let headers = [];
        let body = null;
        if (start_with_blank_l === 0) {
            body = part.subarray(new_l_b.length);
        }else if (Number.isInteger(delimiter_index)) {
            const headers_b = part.subarray(0, delimiter_index).toString().split(new_l_b.toString());
            headers = headers_b;
            body = part.subarray(delimiter_index + header_delimiter.length);
        } else {
            throw new Error('body part parse error.');
        }
        const header_parsed = headers.reduce((result, item) => {
            if (/Content-Disposition/gi.test(item)) {
                const name = /name="(?<name>.+?)"/gi.exec(item);
                if (name) {
                    result['name'] = name.groups.name;
                }
                const filename = /filename="(?<filename>.+?)"/gi.exec(item);
                if (filename) {
                    result['filename'] = filename.groups.filename;
                }
            } else if (/Content-Type/gi.test(item)) {
                result['ContentType'] = item.split(' ').pop();
            }
            return result;
        }, {});

        return {
            headers,
            header_parsed,
            body,
        }
    });
    // log(body_parsed);
    return body_parsed;
}

function simpleParser(req, cb) {
    return new Promise((resolve) => {
        let buffers = [];
        req.on('data', buffers.push.bind(buffers));
        req.on('end', () => {
            const boundary = req.headers['content-type'].split('boundary=').pop();
            const body = Buffer.concat(buffers);
            const body_parsed = simpleMutipartParser(body, boundary);
            cb && cb(body_parsed);
            resolve(body_parsed);
        });
    });
}

exports.simpleMutipartParser = simpleMutipartParser;
exports.simpleParser = simpleParser;



class MutipartParser extends EventEmitter {
    constructor(headers) {
        super();
        const boundary = headers['content-type'].split('boundary=').pop();
        const hyphens_b = Buffer.from('--', 'utf-8');
        const boundary_b = Buffer.from(boundary, 'utf-8');
        this.delimiter = Buffer.concat([hyphens_b, boundary_b, new_l_b]);
        this.buffers = [];
        this.buffedStream = null;
    }
    parse(req) {
        req.on('data', data => {
            this.buffers.push(data);
            this.doParseParts();
        });
        req.on('end', () => {
            this.doFinish();
            this.emit('end');
        });
    }

    createNewStream() {
        // 如果存在正在写的流对象，将流对象结束掉
        if (this.buffedStream) {
            this.buffedStream.end();
        }
        // 新建一个流对象
        this.buffedStream = new stream.Duplex();
    }
    write(buffer) {
        this.buffedStream.write(buffer);
    }

    doParseParts() {
        const body = Buffer.concat(this.buffers);
        const indexes = [...indexesOf(body, this.delimiter)];
        let consumeBuffers = [];
        // 当前暂存的数据中没有出现分界符(肯定不是第一个块)
        if (!indexes.length) {
            // 如果 buffer 的个数多于1个的话
            if (this.buffers.length > 1) {
                // 这时除了最后一个 buffer有可能包含分界符号，其他 buffer 都可以确定时属于前一个 part 的数据
                consumeBuffers = this.buffers.splice(0, this.buffers.length-1);
                consumeBuffers.forEach(buff => this.write(buff));
                return;
            }
            // 如果 buffer 的数量小于等于 1 时，防止块中只包含一半分界符，暂缓分解符的解析
        }
        // 分解符出现在开始位置
        if (indexes[0] === 0) {
            this.createNewStream();
        }

    }
    doFinish() {

    }
}

exports.MutipartParser = MutipartParser;

