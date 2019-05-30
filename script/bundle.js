const fs = require('fs');
const del = require('del');
const zlib = require('zlib');
const path = require('path');
const chalk = require('chalk');
const rollup = require('rollup');
const gzipSize = require('gzip-size');
const childProcess = require('child_process');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve'); // resolve external packages
const typescript = require('rollup-plugin-typescript2'); // notice ts version (https://github.com/ezolenko/rollup-plugin-typescript2/issues/88)
const {uglify} = require('rollup-plugin-uglify');
const {paths, target, targetName, devTarget} = require('./const');

function gzip($src) {
    return new Promise(function (resolve, reject) {
        fs.stat($src, function (err, stats) {
            if (err) {
                reject(err);
                return;
            }
            if (stats.isFile()) {
                let rs = fs.createReadStream($src);
                const $dst = $src + '.gz';
                rs.pipe(zlib.createGzip()).pipe(fs.createWriteStream($dst));
                rs.on('end', resolve);
                return;
            }
            reject('not a file');
        });
    });
}

function reduceSize(distFilePath) {
    const content = fs.readFileSync(distFilePath, 'utf-8');
    const originSize = content.length;
    const afterSize = gzipSize.sync(content);
    const percent = ((originSize - afterSize) / originSize * 100).toFixed(1);
    console.log(`gzip size: ${content.length} --> ${gzipSize.sync(content)} (reduce ${percent}%)`);
}

function createTag(tag) {
    return chalk.green(`[ ${tag} ] `);
}

// const production = !process.env.ROLLUP_WATCH;
const production = process.argv[2] === 'prod';
const dist = production
    ? path.resolve(paths.distDir, target)
    : path.resolve(paths.demoDir, 'page', devTarget);

const inputOptions = {
    input: path.resolve(paths.srcDir, 'index.ts'),
    plugins: [
        typescript({
            tsconfig: 'tsconfig.json',
        }),
        resolve({
            mainFields: ['module', 'main'],
            browser: true
        }),
        commonjs(),
        production && babel({
            runtimeHelpers: true
        }),
        production && uglify()
    ]
};

const outputOptions = {
    file: dist,
    format: 'umd',
    name: targetName,
    sourcemap: true,
    globals: 'window'
};

const watchOptions = {
    ...inputOptions,
    output: [outputOptions]
};


async function buildBundle() {
    const {log, time, timeEnd} = console;
    const cleanTag = createTag('clean');
    const prepareTag = createTag('prepare');
    const generateTag = createTag('generate');
    const writeTag = createTag('write');
    const gzipTag = createTag('gzip');
    const gzipSizeTag = createTag('gzip-size');

    log(chalk.magenta('\n====== clean folder ======'));
    time(cleanTag);
    await del(paths.distDir);
    timeEnd(cleanTag);

    log(chalk.magenta('\n====== preparing for bundle ======'));
    time(prepareTag);
    const bundle = await rollup.rollup(inputOptions);
    timeEnd(prepareTag);

    log(chalk.magenta('\n======== generating bundle ======='));
    time(generateTag);
    await bundle.generate(outputOptions);
    timeEnd(generateTag);

    log(chalk.magenta('\n====== writing bundle files ======'));
    time(writeTag);
    await bundle.write(outputOptions);
    timeEnd(writeTag);

    log(chalk.magenta('\n======  gzip file ======'));
    time(gzipTag);
    await gzip(dist);
    timeEnd(gzipTag);

    log(chalk.magenta('\n====== calculate gzip size ======'));
    time(gzipSizeTag);
    reduceSize(dist);
    timeEnd(gzipSizeTag);
}

function watch(endCb) {
    const watcher = rollup.watch(watchOptions);

    watcher.on('event', event => {
        const log = console.log;
        switch (event.code) {
            case 'START':
                log(chalk.magenta('[ rollup ] start to bundle...'));
                break;

            case 'END':
                log(chalk.magenta('[ rollup ] bundle end, rollup is watching...'));
                endCb && endCb();
                break;

            case 'ERROR':
            case 'FATAL':
                log(chalk.red('[ rollup ] bundle error'));
                log(event);
                break;

            default:
                break;
        }
    });
}

let browserSync;
function watchBundle() {
    let first = true;
    browserSync = require('browser-sync').create();

    const cp = childProcess.fork(path.resolve(paths.demoDir, 'server'), {silent: true});
    cp.on('message', e => {
        const log = console.log;
        const port = e;
        log(chalk.green(`[ server ] example server is running on port: ${port}`));

        watch(function () {
            if (!first) {
                browserSync.reload();
                return;
            }

            browserSync.init({
                proxy: `0.0.0.0:${port}`,
                notify: true,
                port: port
            });
            first = false;
        });
    });
}

// 根据参数进行生产环境打包或开发环境打包监听
production ? buildBundle() : watchBundle();

process.on('exit', () => {
    !production && browserSync.exit();
});
