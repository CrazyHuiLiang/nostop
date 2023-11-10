const { log } = require('node:console');
const http = require('node:http');
const os = require('node:os');
// const path = require('node:path');
const fs = require('node:fs');
const qrcode = require('qrcode-terminal');
const working_dir = process.cwd();

// 获取 pattern_buf 在 buf 中出现的位置
function indexesOf(buf, pattern_buf) {
    const indexes = [];
    let j=0;
    for (let i = 0; i<buf.length; i++) {
        for (j=0; j<pattern_buf.length; j++) {
            const c1 = buf[i+j];
            const c2 = pattern_buf[j];
            log(c1, c2);
            if (c1 !== c2) {
                break;
            }
        }
        j + 1 === pattern_buf.length && indexes.push(i);
    }
    return indexes;
}

// 浏览文件系统
function explore(req, res) {
    const dir_path = working_dir + req.url;

    const index_html = fs.readFileSync(__dirname + '/index.html');
    return res.end(index_html); // TODO

    if (!fs.existsSync(dir_path)) {
        res.statusCode = 404;
        return res.end('Not Found');
    }
    const ent = fs.statSync(dir_path);
    if (ent.isDirectory()) {
        const nodes = fs.readdirSync(dir_path);
        return res.end(JSON.stringify({
            data: nodes
        }), 'utf-8');
    }
    if (ent.isFile()) {
        return res.end(fs.readFileSync(dir_path));
    }
    res.statusCode = 400;
    res.end('Unknown file type.');
}

// const buffer = 
// function get_part(data, delimiter, message_cb) {
// }


// 文件上传
function controller_upload(req, res) {
    let buffers = [];
    req.on('data', buffers.push.bind(buffers));
    req.on('end', () => {
        const r = req;
        const boundary = req.headers['content-type'].split('multipart/form-data; boundary=').pop();
        const boundary_b = Buffer.from(boundary, 'utf-8');
        const new_l_b = Buffer.from('\n', 'utf-8');
        const hyphens = Buffer.from('--', 'utf-8');
        
        const body = Buffer.concat(buffers);
        const sss = body.toString();
        log(sss);


        const indexes = indexesOf(body, boundary_b);
        log(indexes);
        res.end('{}'); 
    });
}
// 文件下载
function controller_download(req, res) {
    log(req, res);
}

exports.start_serve = function (port = 3000) {
    const server = http.createServer((req, res) => {
        if (req.url.startsWith('/_s_upload')) {
            return controller_upload(req, res);
        }
        if (req.url.startsWith('/_s_download')) {
            return controller_download(req, res);
        }
        explore(req, res);
    });
    server.on('listening', () => {
        const inter = os.networkInterfaces();
        console.log('server start at:');
        addresses = Object.values(inter).flat().filter(item => item.family === 'IPv4');
        if (addresses.length > 1) {
            addresses = addresses.filter(item => item.address !== '127.0.0.1');
        }
        addresses.forEach(item => {
            const url = 'http://' + item.address + ':' + port;
            console.log(url);
            qrcode.generate(url);
        });
    });
    server.listen(port);
}
