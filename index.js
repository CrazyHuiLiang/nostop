#!/usr/bin/env node
const child_process = require('node:child_process');
const action = String(process.argv[2]).toLowerCase();

switch(action) {
	case 'm2':
	case 'mergeto': {
		const branch = process.argv[3];
		if (!branch) {
			console.log("缺少目标分支名");
			process.exit(1);
		}
		const ls = child_process.exec(`sh -xe ${__dirname}/m2.sh ${branch}`);

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
	default: {
		console.error('command not found.');
	} break;
}



