const { log } = require('node:console');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const qrcode = require('qrcode-terminal');
const working_dir = process.cwd();
const body_parser = require('./body_parser');

// 浏览文件系统
async function explore(req, res) {
    let param_entry;
    if (/[&?]entry=[^&#]+/gi.test(req.url)) {
        param_entry = decodeURIComponent(/[&?]entry=(?<entry>[^&#]+)/gi.exec(req.url).groups.entry);
    }
    const entry = working_dir + param_entry;
    console.log('explore:', entry);

    if (!fs.existsSync(entry)) {
        res.statusCode = 404;
        return res.end('Not Found');
    }
    const ent = fs.statSync(entry);
    if (ent.isDirectory()) {
        const dir = fs.opendirSync(entry);
        const nodes = [];
        if (param_entry && param_entry !== '/') {
            nodes.push({
                name: '..',
                isDir: true,
            });
        }
        for await (const dirent of dir) {
            nodes.push({
                name: dirent.name,
                isDir: dirent.isDirectory(),
            });
        }
        // log(nodes);
        nodes.sort((node1, node2) => {
            if (node1.isDir && !node2.isDir) {
                return -1;
            }
            if (!node1.isDir && node2.isDir) {
                return 1;
            }
            return 0;
        });
        return res.end(JSON.stringify({
            data: nodes
        }), 'utf-8');
    }
    if (ent.isFile()) {
        return res.end(fs.readFileSync(entry));
    }
    res.statusCode = 400;
    res.end('Unknown file type.');
}

// 文件上传
async function controller_upload(req, res) {
    const body_parsed = await body_parser.simpleParser(req);
    let up_path = working_dir;
    body_parsed.forEach(item => {
        if (item.header_parsed.name === 'entry') {
            up_path += item.body.toString();
        }
    });
    body_parsed.forEach(part => {
        if (part.header_parsed.name === 'file') {
            const file_path = path.resolve(up_path, part.header_parsed.filename);
            fs.writeFileSync(file_path, part.body);
        }
    });
    log(up_path, body_parsed);
    res.end(`{"success": true}`);
}

// 文件下载
function controller_download(req, res) {
    log(req, res);
    res.end(`{"success": false, "info": "not support."}`);
}

exports.start_serve = function (port = 3000) {

    const inter = os.networkInterfaces();
    let addresses = Object.values(inter).flat().filter(item => item.family === 'IPv4');
    if (addresses.length > 1) {
        addresses = addresses.filter(item => item.address !== '127.0.0.1');
    }
    let url;
    addresses.forEach(item => {
        url = item.address + ':' + port;
    });


    const server = http.createServer((req, res) => {
        console.log(req.url);
        if (req.url.startsWith('/_s_explore')) {
            return explore(req, res);
        }
        if (req.url.startsWith('/_s_upload')) {
            return controller_upload(req, res);
        }
        if (req.url.startsWith('/_s_download')) {
            return controller_download(req, res);
        }
        const index_html = fs.readFileSync(__dirname + '/index.html', "utf-8");
        return res.end(index_html.replace('__ip__', url));
    });
    server.on('listening', () => {
        console.log('server start at:');
        console.log('http://' + url);
        qrcode.generate('http://' + url);
    });
    server.listen(port);
}
