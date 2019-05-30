const path = require('path');
const targetName = '<%= dirName %>';
const bundleName = '<%= dirName %>';
const base = path.resolve(__dirname, '..');

module.exports.paths = {
    demoDir: path.resolve(base, 'demo'),
    srcDir: path.resolve(base, 'lib'),
    distDir: path.resolve(base, 'dist')
};

module.exports.target = `${bundleName}.min.js`;
module.exports.devTarget = `${bundleName}.min.js`;
module.exports.targetName = targetName;