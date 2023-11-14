const { log } = require('node:console');
const http = require('node:http');
const os = require('node:os');
// const path = require('node:path');
const fs = require('node:fs');
const qrcode = require('qrcode-terminal');
const working_dir = process.cwd();
const body_parser = require('./body_parser');

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

// 文件上传
async function controller_upload(req, res) {
    const body_parsed = await body_parser.simpleParser(req);
    // let path = ''
    log(body_parsed);
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
