"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeMetadataDirectories = void 0;
var mergeMetadataConfig_1 = require("./mergeMetadataConfig");
var readMetadata_1 = require("./readMetadata");
var writeMetadata_1 = require("./writeMetadata");
var mergeMetadata_1 = require("./mergeMetadata");
function mergeMetadataDirectories(sourceDirectories, targetDirectory, modifyMetadata) {
    console.log('Reading metadata from input directories');
    // map each source directory to an array where each item takes the form [stringOrigin, metadata]
    var sources = sourceDirectories.map(function (origin) { return [origin, (0, readMetadata_1.readMetadata)(origin)]; });
    console.log('Begining merge...');
    // merge all the metadata
    var _a = (0, mergeMetadata_1.mergeMetadata)(sources, mergeMetadataConfig_1.mergeConfig), errors = _a.errors, metadata = _a.metadata;
    if (errors.length) {
        // this utility prints out any errors to console
        console.warn('Encountered the following errors while attempting to merge metadata:');
        (0, mergeMetadata_1.logMergeErrors)(errors);
        throw new Error('Errors encountered, merge aborted. See errors above');
    }
    console.log('Merge completed successfully.');
    // optionally apply the modifyMetadata function
    var outputMetadata = modifyMetadata ? modifyMetadata(metadata) : metadata;
    console.log('Writing metadata to output directory');
    (0, writeMetadata_1.writeMetadata)(targetDirectory, outputMetadata);
    console.log('Finished, exiting script');
}
exports.mergeMetadataDirectories = mergeMetadataDirectories;
