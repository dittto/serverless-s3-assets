'use strict';

const AWS = require('aws-sdk');
const ConfigIntepreter = require('./src/ConfigInterpreter');
const S3Uploader = require('./src/S3Uploader');

class S3Assets {
    constructor(serverless, options) {
        // exclude this directory as we don't do anything on live
        const exclude = serverless.service.package.exclude;
        const excludedFiles = ["node_modules/serverless-s3-assets/**"];
        serverless.service.package.exclude = exclude instanceof Array ? exclude.concat(excludedFiles) : excludedFiles;

        // init hooks
        const config = serverless.service.custom.s3Assets || [];
        this.hooks = {
            'after:deploy:deploy': this.before.bind(this, config, serverless.cli),
            'before:remove:remove': this.remove.bind(this, config)
        };
    }

    before(config, logger) {
        // get config
        const interpreter = new ConfigIntepreter()
        const files = interpreter.get(config);

        // upload files to S3
        const s3Uploader = new S3Uploader(new AWS.S3(), logger);
        return s3Uploader.uploadAllToBucket(files);
    }

    remove(config) {
        // empty files from bucket
        // const s3Uploader = new S3Uploader(new AWS.S3());
        // return s3Uploader.removeAllFiles(config.bucket);
    }
}

module.exports = S3Assets;
