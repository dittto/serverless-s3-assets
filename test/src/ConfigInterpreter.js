'use strict';

const expect = require('chai').expect;
const ConfigInterpreter = require('../../src/ConfigInterpreter');

class S3FileTest {
    constructor() {
        this.files = [];
    }
    addFiles(files, config) {
        files = Array.isArray(files) ? files : [files];
        for (let file of files) {
            this.files.push(file);
        }
    }
    getFiles() {
        return this.files;
    }
}

class FullS3FileTest {
    constructor(folder, name) {
        this.files = [];
        this.folder = folder;
        this.name = name;
    }
    getName() {
        return this.name;
    }
    getFilePath() {
        return this.folder;
    }
    getFiles() {
        return this.files;
    }
    addFiles(files) {
        files = Array.isArray(files) ? files : [files];
        for (let file of files) {
            const hydratedFile = new FullS3FileTest(file);
            this.files.push(hydratedFile);
        }
    }
}

describe('src/ConfigInterpreter', function () {
    it('gets files for folder', function () {
        const FS = {
            readdirSync: (folder) => {
                return [folder, 'a', 'b'];
            }
        };
        const config = new ConfigInterpreter(FS, {}, {});
        expect(config.getFilesForFolder('folder')).to.have.same.members(['folder', 'a', 'b']);
    });

    it('falls back to an empty array when trying to get files for a folder and an error occurs', function () {
        const FS = {
            readdirSync: (folder) => {
                throw new Error('Test fail');
            }
        };
        const logger = {
            logMessage: null,
            log: (message) => {
                logger.logMessage = message;
            }
        };
        const config = new ConfigInterpreter(FS, {}, logger);
        expect(config.getFilesForFolder('folder')).to.have.length(0);
        expect(logger.logMessage).to.equal('Failed to get files for "folder"');
    });

    it('gets sub-folders until there are no more to get', function () {
        const FS = {
            storedFiles: [],

            readdirSync: (folder) => {
                if (folder === 'a') {
                    return {getName: () => 'a', getFilePath: () => folder, getFiles: () => [FS.readdirSync('a/b'), FS.readdirSync('a/c'), FS.readdirSync('a/d')], addFiles: (files) => {FS.storedFiles.push({folder, files})}};
                }
                if (folder === 'a/c') {
                    return {getName: () => 'c', getFilePath: () => folder, getFiles: () => [FS.readdirSync('a/c/e'), FS.readdirSync('a/c/f'), FS.readdirSync('a/c/g')], addFiles: (files) => {FS.storedFiles.push({folder, files})}};
                }
                if (folder === 'a/c/e') {
                    return {getName: () => 'e', getFilePath: () => folder, getFiles: () => [], addFiles: (files) => {FS.storedFiles.push({folder, files})}};
                }
                if (folder === 'a/c/f') {
                    return {getName: () => 'f', getFilePath: () => folder, getFiles: () => [FS.readdirSync('a/c/f/h'), FS.readdirSync('a/c/f/i')], addFiles: (files) => {FS.storedFiles.push({folder, files})}};
                }
                return {getName: () => folder, getFilePath: () => folder, getFiles: () => [], addFiles: (files) => {FS.storedFiles.push({folder, files})}};
            }
        };
        const config = new ConfigInterpreter(FS, {}, {});
        config.getSubs([FS.readdirSync('a')], {});
        const scannedFiles = FS.storedFiles.map((data) => data.folder);
        expect(scannedFiles).to.have.same.members(['a', 'a/b', 'a/c', 'a/d', 'a/c/e', 'a/c/f', 'a/c/g', 'a/c/f/h', 'a/c/f/i']);
    });

    it('gets a whole list of files for a folder structure', function () {
        const FS = {
            readdirSync: (folder) => {
                if (folder === 'a') {
                    return ['a/b', 'a/c', 'a/d'];
                }
                if (folder === 'a/c') {
                    return ['a/c/e', 'a/c/f', 'a/c/g'];
                }
                return [];
            }
        };
        const config = new ConfigInterpreter(FS, FullS3FileTest, {});
        const files = config.get({'a': []});
        expect(files[0].getFilePath()).to.equal('a');
        expect(files[0].getFiles()[0].getFilePath()).to.equal('a/b');
        expect(files[0].getFiles()[1].getFilePath()).to.equal('a/c');
        expect(files[0].getFiles()[1].getFiles()[0].getFilePath()).to.equal('a/c/e');
        expect(files[0].getFiles()[1].getFiles()[1].getFilePath()).to.equal('a/c/f');
        expect(files[0].getFiles()[1].getFiles()[2].getFilePath()).to.equal('a/c/g');
    });
});
