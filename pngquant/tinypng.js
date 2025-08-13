#!/bin/bash
const PngQuant = require('pngquant');
const fg = require('fast-glob');
const path = require('path');
const fs = require('fs');

module.exports = async function (glob) {
    const stream = fg.stream(glob, { dot: true });
    console.log('当前工作目录:', process.cwd());
    for await (const filename of stream) {
        const myPngQuanter = new PngQuant([192, '--quality', '40-50', '--nofs', '-']);
        const sourceName = path.join(process.cwd(), filename);
        const destName = path.join(process.cwd(), filename.replace(/\.png$/, '-compressed.png'));
        console.log(sourceName, '->');
        const sourceStream = fs.createReadStream(sourceName);
        const destinationStream = fs.createWriteStream(destName);
        sourceStream.pipe(myPngQuanter).pipe(destinationStream);

        await new Promise((resolve, reject) => {
            destinationStream.on('finish', () => {
                console.log(destName, '\n');
                resolve();
            });
            destinationStream.on('error', reject);
        });
    }
}
