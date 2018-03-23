'use strict';

const AWS = require('aws-sdk');
const FS = require('fs');
const ConfigIntepreter = require('./src/ConfigInterpreter');
const S3Uploader = require('./src/S3Uploader');
const S3File = require('./src/S3File');

class S3Assets {
    constructor(serverless, options) {
        // exclude this directory as we don't do anything on live
        const exclude = serverless.service.package.exclude;
        const excludedFiles = ["node_modules/serverless-s3-assets/**"];
        serverless.service.package.exclude = exclude instanceof Array ? exclude.concat(excludedFiles) : excludedFiles;

        // init hooks
        const interpreter = new ConfigIntepreter(FS, S3File, serverless.cli);
        const s3Uploader = new S3Uploader(new AWS.S3({ signatureVersion: 'v4' }), FS, serverless.cli);
        const config = serverless.service.custom && serverless.service.custom.s3Assets ? serverless.service.custom.s3Assets : [];
        this.options = options;
        this.commands = {
            s3deploy: {
                usage: 'Deploy assets to S3 bucket',
                lifecycleEvents: [
                    'deploy'
                ],
                options: {
                    asset: {
                        usage: 'Limit the deployment to a specific asset',
                        shortcut: 'a'
                    }
                }
            },
            s3remove: {
                usage: 'Remove deployed assets from S3 bucket',
                lifecycleEvents: [
                    'remove'
                ],
                options: {
                    asset: {
                        usage: 'Limit the removement to a specific asset',
                        shortcut: 'a'
                    }
                }
            }
        };
        this.hooks = {
            's3deploy:deploy': this.deploy.bind(this, interpreter, s3Uploader, config),
            's3remove:remove': this.remove.bind(this, interpreter, s3Uploader, config),
            'after:deploy:deploy': this.deploy.bind(this, interpreter, s3Uploader, config),
            'before:remove:remove': this.remove.bind(this, interpreter, s3Uploader, config)
        };
    }

    deploy(interpreter, s3Uploader, config) {
        const files = interpreter.get(config, this.options);
        return s3Uploader.uploadAllToBucket(files);
    }

    remove(interpreter, s3Uploader, config) {
        const buckets = [];
        const files = interpreter.get(config, this.options);
        for (let file of files) {
            buckets[buckets.length] = file.getBucket();
        }

        return s3Uploader.removeAllFiles(buckets);
    }
}

module.exports = S3Assets;
