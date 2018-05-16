'use strict';

const mime = require('mime-types');

class S3File {
    constructor(name, filePath, relativePath, settings) {
        this.files = [];
        this.name = name;
        this.filePath = (filePath ? filePath + '/' : '') + name;
        this.relativePath = (relativePath ? relativePath + '/' : '') + (this.filePath == name ? '' : name);
        this.addSettings(settings);
    }

    addSettings(settings) {
        this.settings = this.settings || [];

        if (settings.bucket) this.settings.bucket = settings.bucket;

        if (settings.acl) this.settings.acl = settings.acl;
        if (settings.isPublic === true)  this.settings.acl = 'public-read';
        if (settings.isPublic === false) this.settings.acl = 'private';

        if (settings.cacheControl) this.settings.cacheControl = settings.cacheControl;
        if (settings.cacheTime)    this.settings.cacheControl = 'max-age=' + settings.cacheTime;

        if (settings.contentType) this.settings.contentType = settings.contentType;

        if (settings.metadata) this.settings.metadata = settings.metadata;
    }

    addFiles(files, config) {
        for (let file of files) {
            const settingsClone = Object.assign({}, this.settings);
            settingsClone['metadata'] = Object.assign({}, settingsClone['metadata']);
            const s3File = new S3File(file, this.filePath, this.relativePath, settingsClone);
            s3File.addSettings(config[file] || []);
            this.files[this.files.length] = s3File;
        }
    }

    getName() {
        return this.name;
    }

    getFilePath() {
        return this.filePath;
    }

    getRelativePath() {
        return this.relativePath;
    }

    getFiles() {
        return this.files;
    }

    getBucket() {
        return this.settings.bucket;
    }

    getAcl() {
        return this.settings.acl || 'private';
    }

    getMetadata() {
        return this.settings.metadata || {};
    }

    getCacheControl() {
        return this.settings.cacheControl || 'max-age=0';
    }

    getContentType() {
        return mime.lookup(this.getFilePath()) || this.settings.contentType || 'text/plain';
    }

    /**
     * Gets all files as a simple array. This removes any directories as S3
     * only supports files.
     * @returns {Array}
     */
    getFlattenedFiles() {
        const store = [];
        let currentStore = this.getFiles();
        while (currentStore.length > 0) {
            let tempStore = [];
            for (let file of currentStore) {
                tempStore = tempStore.concat(file.getFiles());
                if (file.getFiles() == 0) {
                    store[store.length] = file;
                }
            }
            currentStore = tempStore;
        }

        return store;
    }
}

module.exports = S3File;
