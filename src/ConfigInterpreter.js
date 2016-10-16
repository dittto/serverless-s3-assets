'use strict';

const FS = require('fs');
const S3File = require('./S3File');

class ConfigInterpreter {
    get(config) {
        // loop through each first-level of files / folders defined
        const folders = [];
        for (let folder of Object.keys(config)) {
            // gets the first level of data
            const s3Folder = new S3File(folder, '', '', config[folder]);
            s3Folder.addFiles(this.getFilesForFolder(folder), config[folder]);

            // starts the recursive loop through all folders and files
            this.getSubs(s3Folder.getFiles(), config[folder]);

            // store each folder
            folders[folders.length] = s3Folder;
        }

        return folders;
    }

    getSubs(files, config) {
        for (let file of files) {
            const subConfig = config[file.getName()] || [];
            file.addFiles(this.getFilesForFolder(file.getFilePath()), subConfig);
            this.getSubs(file.getFiles(), subConfig);
        }
    }

    getFilesForFolder(folder) {
        try {
            return FS.readdirSync(folder);
        } catch (error) {
            return [];
        }
    }
}

module.exports = ConfigInterpreter;
