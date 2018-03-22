'use strict';

const mime = require('mime-types');
class S3Uploader {
    constructor(s3, FS, logger) {
        this.s3 = s3;
        this.FS = FS;
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
                Body: this.FS.readFileSync(file.getFilePath()),
                ACL: file.getAcl(),
                CacheControl: file.getCacheControl(),
                ContentType: mime.lookup(file.getFilePath()) || file.getContentType(),
                Metadata: file.getMetadata()
            };

            promises[promises.length] = new Promise((resolve, reject) => {
                this.s3.upload(params, (err, data) => {
                    if (err) {
                        this.logger.log(err);
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
                    reject(errors);
                }
            );
        });
    }

    removeAllFiles(buckets) {
        const listPromises = [];
        for (let bucket of buckets) {
            const params = {
                Bucket: bucket
            };

            listPromises[listPromises.length] = new Promise((resolve, reject) => {
                this.s3.listObjectsV2(params).promise().then(
                    values => {
                        const keys = [];
                        for (let value of values.Contents) {
                            keys[keys.length] = {Key: value.Key};
                        }
                        resolve({bucket: bucket, keys: keys});
                    }
                );
            });
        }

        const returnPromises = [];

        return new Promise((resolve, reject) => {
            Promise.all(listPromises).then(data => {
                for (let val of data) {
                    const params = {
                        Bucket: val.bucket,
                        Delete: {
                            Objects: val.keys
                        }
                    };
                    returnPromises[returnPromises.length] = this.s3.deleteObjects(params).promise();
                }


                Promise.all(returnPromises).then(values => resolve(values)).catch(e => reject(e));
            });
        });
    }
}

module.exports = S3Uploader;
