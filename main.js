#!/usr/bin/env node
var mkdirp = require('mkdirp'),
    minimist = require('minimist'),
    path = require('path'),
    fs = require('fs'),
    fse = require('fs-extra');

var config = minimist(process.argv.slice(2));
var projectName = config._[0] || path.basename(process.cwd());
if (!projectName) {
    console.log('No project name!');
    return;
}
var targetName = config.local || config.l ? '.' : projectName;
var modulesPath = path.dirname(require.resolve('.'));
var fileNames = ['common.jade', 'config.scss', 'ui.reset.scss', 'index.jade', 'index.scss', 'index.json', 'index.js', 'index.debug.js', 'data.imgs'];
var projectFiles = ['gulpfile.js', 'package.json', '.eslintrc', '.eslintignore'];

fs.stat(path.join(process.cwd(), targetName), function (err, stats) {

    if ((!(config.f || config.force)) && stats && stats.isDirectory()) {
        console.log('Project exist in current direcotry');
    } else {
        if(targetName === '.') {
            copyFiles();
        } else {
            mkdirp(projectName, function (err) {
                if (err) { console.log(err); }
                copyFiles();
            });
        }
    }
});

function copyFiles() {
    fileNames.forEach(function (item) {
        var targetDir = item.split('.').pop(),
            targetFile = item.replace('index', projectName);
        copyTo(path.join(modulesPath, 'templates', item), path.join(process.cwd(), targetName, targetDir, targetFile));
    });
    projectFiles.forEach(function (item) {
        if (item === 'package.json') {
            fse.readJson(path.join(modulesPath, 'templates/package.json'), function (err, packageObj) {
                if (err) { console.log(err); }
                packageObj.name = projectName;
                fse.writeJson(path.join(process.cwd(), targetName, './package.json'), packageObj, function (err) {
                    if (err) { console.log(err); }
                });
            });
        } else {
            copyTo(path.join(modulesPath, 'templates', item), path.join(process.cwd(), targetName, item));
        }
    });
}
function copyTo(src, target) {
    fse.copy(src, target, function (err) {
        if (err) { console.log(err); }
    });
}