'use strict';

const expect = require('chai').expect;
const S3File = require('../../src/S3File');

describe('src/S3File', function () {
    it('inits with default settings', function () {
        const file = new S3File('name', '', '', []);
        expect(file.getFiles()).to.have.same.members([]);
        expect(file.getName()).to.equal('name');
        expect(file.getFilePath()).to.equal('name');
        expect(file.getRelativePath()).to.equal('');

        expect(file.settings).to.have.same.members([]);
        expect(file.getAcl()).to.equal('private');
        expect(JSON.stringify(file.getMetadata())).to.equal(JSON.stringify({}));
        expect(file.getCacheControl()).to.equal('max-age=0');
        expect(file.getContentType()).to.equal('text/plain');
    });

    it('inits with specific file path settings', function () {
        const file = new S3File('name', 'filePath', '', []);
        expect(file.getFilePath()).to.equal('filePath/name');
        expect(file.getRelativePath()).to.equal('name');
    });

    it('inits with specific relative path settings', function () {
        const file = new S3File('name', '', 'relativePath', []);
        expect(file.getRelativePath()).to.equal('relativePath/');
    });

    it('sets the bucket setting', function () {
        const file = new S3File('', '', '', {
            'bucket': 'bucket-1'
        });
        expect(file.getBucket()).to.equal('bucket-1');
    });

    it('adds basic acl setting', function () {
        const file = new S3File('', '', '', {
            'acl': 'fake-acl'
        });
        expect(file.getAcl()).to.equal('fake-acl');
    });

    it('uses the is public defaults for acl setting', function () {
        const file = new S3File('', '', '', {
            'acl': 'fake-acl',
            'isPublic': true
        });
        expect(file.getAcl()).to.equal('public-read');

        file.addSettings({'isPublic': false});
        expect(file.getAcl()).to.equal('private');
    });

    it('sets cache control setting', function () {
        const file = new S3File('', '', '', {
            'cacheControl': 'fake-cachecontrol'
        });
        expect(file.getCacheControl()).to.equal('fake-cachecontrol');
    });

    it('overrides cache control setting when cache time is specified', function () {
        const file = new S3File('', '', '', {
            'cacheControl': 'fake-cachecontrol',
            'cacheTime': 1024
        });
        expect(file.getCacheControl()).to.equal('max-age=1024');
    });

    it('sets content type setting', function () {
        const file = new S3File('', '', '', {
            'contentType': 'fake-contenttype'
        });
        expect(file.getContentType()).to.equal('fake-contenttype');
    });

    it('sets metadata setting', function () {
        const file = new S3File('', '', '', {
            'metadata': {'fake-metadata': 'fake'}
        });
        expect(JSON.stringify(file.getMetadata())).to.equal(JSON.stringify({'fake-metadata': 'fake'}));
    });

    it('adds a list of files, checking the metadata isn\'t cloned from a child file to it\'s parent', function () {
        const parentFile = new S3File('', '', '', {
            'acl': 'fake-acl',
            'metadata': {'fake-metadata': 'fake'}
        });
        const childFileConfig = {'child': {
            'acl': 'faker-acl',
            'metadata': {'fake-metadata': 'more fake'}
        }};
        parentFile.addFiles(['child'], childFileConfig);

        expect(parentFile.getAcl()).to.equal('fake-acl');
        expect(parentFile.getMetadata()).to.have.key('fake-metadata');
        expect(parentFile.getMetadata()['fake-metadata']).to.equal('fake');

        expect(parentFile.getFiles()[0].getAcl()).to.equal('faker-acl');
        expect(parentFile.getFiles()[0].getMetadata()).to.have.key('fake-metadata');
        expect(parentFile.getFiles()[0].getMetadata()['fake-metadata']).to.equal('more fake');
    });

    it('adds a list of files that are missing config, so parent data is used', function () {
        const parentFile = new S3File('', '', '', {
            'acl': 'fake-acl',
            'metadata': {'fake-metadata': 'fake'}
        });
        const missingFileConfig = {};
        parentFile.addFiles(['child'], missingFileConfig);

        expect(parentFile.getFiles()[0].getAcl()).to.equal('fake-acl');
        expect(parentFile.getFiles()[0].getMetadata()).to.have.key('fake-metadata');
        expect(parentFile.getFiles()[0].getMetadata()['fake-metadata']).to.equal('fake');
    });

    it('returns a tree of files as a simple array, removing any directories', function () {
        const parentFile = new S3File('', '', '', {
            'acl': 'fake-acl',
            'metadata': {'fake-metadata': 'fake'}
        });
        const childFileConfig = {'child': {
            'acl': 'faker-acl',
            'metadata': {'fake-metadata': 'more fake'}
        }};
        parentFile.addFiles(['child', 'child-2'], childFileConfig);
        parentFile.getFiles()[0].addFiles(['grandchild-1', 'grandchild-2'], {});

        const flattenedFiles = parentFile.getFlattenedFiles();
        const fileNames = flattenedFiles.map(file => file.getName());
        expect(fileNames).to.have.same.members(['child-2', 'grandchild-1', 'grandchild-2']);
    });
});
