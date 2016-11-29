'use strict';

const expect = require('chai').expect;
const S3Uploader = require('../../src/S3Uploader');

class testFile {
    constructor(name) {this.name = name;}
    getRelativePath() {return this.name + '-relative-path';}
    getFilePath() {return this.name + '-file-path';}
    getAcl() {return this.name + '-acl';}
    getCacheControl() {return this.name + '-cache-control';}
    getContentType() {return this.name + '-content-type';}
    getMetadata() {return this.name + '-metadata';}
}

class testLogger {
    constructor() {this.messages = [];}
    log(message) {this.messages.push(message);}
}

class testFileSystem {
    readFileSync(body) {return 'body-' + body;}
}

describe('src/S3Uploader', function () {
    it('uploads all files in a folder', function () {
        class testS3 {
            upload(params, callback) {
                callback(null, 'valid-result-' + params.Body);
            }
        }

        const folder = {
            getBucket() {return 'test-bucket';},
            getFlattenedFiles() {return [new testFile('file-1'), new testFile('file-2')]},
        };

        const uploader = new S3Uploader(new testS3(), new testFileSystem(), new testLogger());
        return uploader.uploadToBucket(folder).then(result => {
            expect(result).to.have.same.members(['valid-result-body-file-1-file-path', 'valid-result-body-file-2-file-path']);
        });
    });

    it('rejects on an error when uploads all files in a folder', function () {
        class testS3 {
            upload(params, callback) {
                callback('invalid-' + params.Metadata, null);
            }
        }

        const folder = {
            getBucket() {return 'test-bucket';},
            getFlattenedFiles() {return [new testFile('file-1'), new testFile('file-2')]},
        };

        const uploader = new S3Uploader(new testS3(), new testFileSystem(), new testLogger());
        return uploader.uploadToBucket(folder).catch(e => {
            expect(e).to.equal('invalid-file-1-metadata');
        });
    });

    it('uploads multiple folders in one go', function () {
        class testS3 {
            upload(params, callback) {
                return callback(null, 'valid-result-' + params.Body);
            }
        }

        const folders = [
            {
                getBucket() {return 'test-bucket';},
                getFlattenedFiles() {return [new testFile('file-1'), new testFile('file-2')]},
            },
            {
                getBucket() {return 'test-bucket-2';},
                getFlattenedFiles() {return [new testFile('file-3')]},
            }
        ];

        const uploader = new S3Uploader(new testS3(), new testFileSystem(), new testLogger());
        return uploader.uploadAllToBucket(folders).then(value => {
            expect(value).to.equal('S3 assets uploading complete');
        });
    });

    it('uploads multiple folders in one go when 1 or more fails', function () {
        class testS3 {
            upload(params, callback) {
                if (params.Metadata === 'file-2-metadata') {
                    return callback('invalid-' + params.Metadata, null);
                }
                return callback(null, 'valid-result-' + params.Body);
            }
        }

        const folders = [
            {
                getBucket() {return 'test-bucket';},
                getFlattenedFiles() {return [new testFile('file-1'), new testFile('file-2')]},
            },
            {
                getBucket() {return 'test-bucket-2';},
                getFlattenedFiles() {return [new testFile('file-3')]},
            }
        ];

        const uploader = new S3Uploader(new testS3(), new testFileSystem(), new testLogger());
        return uploader.uploadAllToBucket(folders).catch(e => {
            expect(e).to.equal('S3 assets uploading failed');
        });
    });

    it('tries to remove all files in multiple buckets', function () {
        class testS3 {
            listObjectsV2(params) {
                return {
                    promise() {
                        return new Promise((resolve, reject) => {
                            resolve({
                                Contents: [{Key: 'key-1'}, {Key: 'key-2'}, {Key: 'key-3'}]
                            });
                        });
                    }
                }
            }

            deleteObjects(params) {
                return {
                    promise() {
                        return new Promise((resolve, reject) => {
                            resolve(params);
                        });
                    }
                }
            }
        }

        const uploader = new S3Uploader(new testS3(), new testFileSystem(), new testLogger());
        return uploader.removeAllFiles(['bucket-1', 'bucket-2']).then(values => {
            expect(values[0].Bucket).to.equal('bucket-1');
            expect(values[0].Delete.Objects.length).to.equal(3);
            expect(values[1].Bucket).to.equal('bucket-2');
            expect(values[1].Delete.Objects.length).to.equal(3);
        });
    });

    it('tries to remove all files in multiple buckets but an error occurs', function () {
        class testS3 {
            listObjectsV2(params) {
                return {
                    promise() {
                        return new Promise((resolve, reject) => {
                            resolve({
                                Contents: [{Key: 'key-1'}, {Key: 'key-2'}, {Key: 'key-3'}]
                            });
                        });
                    }
                }
            }

            deleteObjects(params) {
                return {
                    promise() {
                        return new Promise((resolve, reject) => {
                            reject('failure to delete');
                        });
                    }
                }
            }
        }

        const uploader = new S3Uploader(new testS3(), new testFileSystem(), new testLogger());
        return uploader.removeAllFiles(['bucket-1']).catch(e => {
            expect(e).to.equal('failure to delete');
        });
    });
});
