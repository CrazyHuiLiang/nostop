
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
    const new_l_b = Buffer.from('\r\n', 'utf-8');
    const hyphens_b = Buffer.from('--', 'utf-8');
    const delimiter = Buffer.concat([hyphens_b, boundary_b]);
    
    const indexes = [...indexesOf(body, delimiter)];
    // log(indexes);

    const body_parts = [];
    for (let i=0; i<indexes.length-1; i++) {
        const start = indexes[i] + delimiter.length + new_l_b.length;
        const end = indexes[i+1] - new_l_b.length;
        const part = body.subarray(start, end);
        // const part_s = part.toString();
        // log('-------\n', part_s);
        body_parts.push(part);
    }

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
            body = part.subarray(delimiter_index);
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

