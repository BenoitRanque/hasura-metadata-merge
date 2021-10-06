"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeMetadataDirectories = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var mergeMetadataConfig_1 = require("./mergeMetadataConfig");
var readMetadata_1 = require("./readMetadata");
var writeMetadata_1 = require("./writeMetadata");
var mergeMetadata_1 = require("./mergeMetadata");
var load_files_1 = require("@graphql-tools/load-files");
var merge_1 = require("@graphql-tools/merge");
var graphql_1 = require("graphql");
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
        var typeDefs = (0, load_files_1.loadFilesSync)(sourceDirectories.map(function (origin) { return path_1.default.join(origin, 'actions.graphql'); }));
        console.log('Merging type definitions for actions. Note graphql type validation is not checked.');
        var mergedTypeDefs = (0, merge_1.mergeTypeDefs)(typeDefs, {
            throwOnConflict: true,
            consistentEnumMerge: true,
            useSchemaDefinition: false,
            ignoreFieldConflicts: false,
            forceSchemaDefinition: false,
        });
        console.log('Merge completed successfully, writing metadata to output directory.');
        (0, writeMetadata_1.writeMetadata)(targetDirectory, metadata);
        fs_1.default.writeFileSync(path_1.default.join(targetDirectory, 'actions.graphql'), (0, graphql_1.print)(mergedTypeDefs));
    }
}
exports.mergeMetadataDirectories = mergeMetadataDirectories;
