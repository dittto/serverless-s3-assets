'use strict';

const expect = require('chai').expect;
const S3Assets = require('../index');


class S3AssetsTest extends S3Assets {
    deploy(interpreter, s3Uploader, config) {
        return config;
    }
}

describe('index', function () {
    it('sets an empty exclude list with it\'s own files', function () {
        const serverless = {
            service: {
                package: {}
            }
        };

        const assets = new S3Assets(serverless, []);
        expect(serverless.service.package.exclude).to.have.same.members(["node_modules/serverless-s3-assets/**"]);
    });

    it('updates an existing exclude lust with it\'s own files', function () {
        const serverless = {
            service: {
                package: {
                    exclude: ['one', 'two']
                }
            }
        };

        const assets = new S3Assets(serverless, []);
        expect(serverless.service.package.exclude).to.have.same.members(["node_modules/serverless-s3-assets/**", 'one', 'two']);
    });

    it('has the relevant hooks', function () {
        const serverless = {
            service: {
                package: {}
            }
        };
        const assets = new S3Assets(serverless, []);
        expect(assets.hooks).to.have.property(['after:deploy:deploy']);
        expect(assets.hooks).to.have.property(['before:remove:remove']);
    });

    it('passes the valid config to the hooks', function () {
        const serverless = {
            service: {
                package: {},
                custom: {
                    s3Assets: ['one', 'two']
                }
            }
        };
        const assets = new S3AssetsTest(serverless, []);
        expect(assets.hooks['after:deploy:deploy']()).to.have.deep.same.members(serverless.service.custom.s3Assets);
    });

    it('passes no config to the hooks if not set', function () {
        const serverless = {
            service: {
                package: {}
            }
        };
        const assets = new S3AssetsTest(serverless, []);
        expect(assets.hooks['after:deploy:deploy']()).to.have.length(0);
    });

    it('uploads files when deploy method is run', function () {
        const serverless = {service: {package: {}}};
        const interpreter = {
            get: (config) => {
                return ['a', 'b', 'c'];
            }
        };
        const s3Uploader = {
            uploadAllToBucketParam: null,
            uploadAllToBucket: (files) => {
                s3Uploader.uploadAllToBucketParam = files;
            }
        };
        const assets = new S3Assets(serverless, []);
        assets.deploy(interpreter, s3Uploader, []);
        expect(s3Uploader.uploadAllToBucketParam).to.have.same.members(interpreter.get([]));
    });

    it('removes all files from given buckets when the remove method is run', function () {
        const serverless = {service: {package: {}}};
        const interpreter = {
            get: (config) => {
                return [{getBucket: () => {return 'bucket_1'}}, {getBucket: () => {return 'bucket_2'}}];
            }
        };
        const s3Uploader = {
            removeAllFilesParam: null,
            removeAllFiles: (buckets) => {
                s3Uploader.removeAllFilesParam = buckets;
            }
        };
        const assets = new S3Assets(serverless, []);
        assets.remove(interpreter, s3Uploader, []);
        expect(s3Uploader.removeAllFilesParam).to.have.same.members(['bucket_1', 'bucket_2']);
    });
});
