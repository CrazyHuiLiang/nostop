#!/usr/bin/env node
const child_process = require('child_process');
const serve = require('./serve/index');
const fs = require('fs');
const tinypng = require('./pngquant/tinypng');
const action = String(process.argv[2]).toLowerCase();
const version = require('./package.json').version;

switch(action) {
	case 'm2':
	case 'mergeto': {
		const branch = process.argv[3];
		if (!branch) {
			console.log("缺少目标分支名");
			process.exit(1);
		}
		const ls = child_process.exec(`sh -xe ${__dirname}/m2/m2.sh ${branch}`);

		ls.stdout.on('data', (data) => {
			console.log(data.toString());
		});

		ls.stderr.on('data', (data) => {
			console.error(data.toString());
		});

		ls.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
		});

		// child_process.exec(`./m2.sh ${branch}`);
		// console.log(branch);
	} break;
    case 'tinypng': {
		const glob = process.argv[3];
		if (!glob) {
			console.log("缺少文件名/通配符");
			process.exit(1);
		}
        tinypng(glob);
    } break;
	case 'serve': {
		const port = process.argv[3];
		serve.start_serve(port);
	} break;
	default: {
        const marked = require('marked');
        const TerminalRenderer = require('marked-terminal');
        console.log('nostop@' + version);
        console.log('commit issue: https://github.com/CrazyHuiLiang/nostop/issues');
        // console.log('TerminalRenderer', marked);
        marked.setOptions({
            // Define custom renderer
            renderer: new TerminalRenderer.default()
        });

        // Show the parsed data
        console.log(
            marked.marked(fs.readFileSync(__dirname + '/help', 'utf-8'))
        );
	} break;
}
