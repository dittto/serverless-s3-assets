# Serverless S3 assets

Sometimes you have some fixed assets that need to be uploaded to S3, such as images or css files. This plugin will do that, and delete the assets when you run serverless remove.

[![Build Status](https://travis-ci.org/dittto/serverless-s3-assets.svg?branch=master)](https://travis-ci.org/dittto/serverless-s3-assets) [![Coverage Status](https://coveralls.io/repos/github/dittto/serverless-s3-assets/badge.svg)](https://coveralls.io/github/dittto/serverless-s3-assets) [![npm](https://badge.fury.io/js/serverless-s3-assets.svg)](https://www.npmjs.com/package/serverless-s3-assets)

## How to use

To use this, you'll need to specify the files to copy to your bucket. You do this in serverless.yml:

```yaml
plugins:
  - serverless-s3-assets

custom:
  s3Assets:
    test-html:
      bucket: ${self:custom.shared.s3Bucket}
      isPublic: false
      cacheTime: 300
      contentType: text/html
      templates:
        cacheTime: 20
```

The `test-html` is the relative folder name of the files to upload to the bucket. The possible options available are:

- bucket: Only available to use on the root folder. This defines the name of the bucket to upload these files to.
- acl: Set this to a specific, valid ACL setting.
- isPublic: set this to true or false to override any ACL setting. True is the same as `public-read` and false is the same as `private`.
- cacheControl: Any cache control settings.
- cacheTime: This overrides any existing cache-control settings and sets a max-age for the file.
- contentType: default type of content we're uploading, if not obvious. Plugin will try to derive the type from file extention first.
- metadata: Any extra metadata to upload.

Any other options specified will be treated as sub-folder names, like `templates` above. This also shows you how to have sub-folders with different settings. By default, all files and folders within the specified root folder name will be uploaded with the same options as that root folder.

### Commands

The code will trigger automatically during a `serverless deploy` and `serverless remove`.

You can also carry out S3 deployment or removal independent from stack deployments:

```yaml
sls s3delpoy

sls s3remove
```

If you have defined multiple assets (folders) you can limit the action to a single one:

```yaml
sls s3delpoy --asset test-html
```

### Gotchas

Make sure you don't add any additional files to your bucket that you're specifying in s3Assets. If you do and then run `serverless remove` then those additional files will also be removed.

### Permissions

You don't need any special permissions for your Lambda as the code is run by Serverless instead.
