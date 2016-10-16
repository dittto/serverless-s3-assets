'use strict';

const FS = require('fs');

class S3Uploader {
    constructor(s3, logger) {
        this.s3 = s3;
        this.logger = logger;
    }

    uploadAllToBucket(folders) {
        this.logger.log('Start uploading S3 assets');
        const promises = [];
        for (let folder of folders) {
            promises[promises.length] = this.uploadToBucket(folder);
        }

        return new Promise((resolve, reject) => {
            Promise.all(promises).then(
                values => {
                    this.logger.log('Completed uploading S3 assets');
                    resolve('S3 assets uploading complete');
                },
                errors => {
                    reject('S3 assets uploading failed');
                }
            );
        });
    }

    uploadToBucket(folder) {
        const promises = [];

        const files = folder.getFlattenedFiles();
        for (let file of files) {
            const params = {
                Bucket: folder.getBucket(),
                Key: file.getRelativePath(),
                Body: FS.readFileSync(file.getFilePath()),
                ACL: file.getAcl(),
                CacheControl: file.getCacheControl(),
                ContentType: file.getContentType(),
                Metadata: file.getMetadata()
            };

            promises[promises.length] = new Promise((resolve, reject) => {
                this.s3.upload(params, (err, data) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(data);
                });
            });
        }

        return new Promise((resolve, reject) => {
            Promise.all(promises).then(
                values => {
                    resolve(values);
                },
                errors => {
                    reject(reject);
                }
            );
        });
    }

    removeAllFiles(bucket) {
        console.log('remove all files');
    }
}

module.exports = S3Uploader;
