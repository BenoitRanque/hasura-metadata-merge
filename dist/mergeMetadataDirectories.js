"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeMetadataDirectories = void 0;
var mergeMetadataConfig_1 = require("./mergeMetadataConfig");
var readMetadata_1 = require("./readMetadata");
var writeMetadata_1 = require("./writeMetadata");
var mergeMetadata_1 = require("./mergeMetadata");
function mergeMetadataDirectories(sourceDirectories, targetDirectory) {
    console.log('Reading metadata from input directories');
    var sources = sourceDirectories.map(function (origin) { return [origin, (0, readMetadata_1.readMetadata)(origin)]; });
    console.log('Begining merge...');
    var _a = (0, mergeMetadata_1.mergeMetadata)(sources, mergeMetadataConfig_1.mergeConfig), errors = _a.errors, metadata = _a.metadata;
    if (errors.length) {
        (0, mergeMetadata_1.logMergeErrors)(errors);
        console.log('Errors encountered, merge aborted. See errors above');
    }
    else {
        console.log('Merge completed successfully, writing metadata to output directory.');
        (0, writeMetadata_1.writeMetadata)(targetDirectory, metadata);
    }
}
exports.mergeMetadataDirectories = mergeMetadataDirectories;
