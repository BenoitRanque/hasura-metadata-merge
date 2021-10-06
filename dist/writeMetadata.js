"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMetadata = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var js_yaml_1 = __importDefault(require("js-yaml"));
function writeFile(outputPath, file, yamlDump) {
    if (yamlDump === void 0) { yamlDump = true; }
    try {
        fs_1.default.writeFileSync(path_1.default.join.apply(path_1.default, outputPath), yamlDump
            ? js_yaml_1.default.dump(file, { noArrayIndent: true, quotingType: '"' })
            : file);
    }
    catch (error) {
        throw error;
    }
}
function clearDirectory(outputDir) {
    fs_1.default.rmSync(outputDir, { recursive: true, force: true });
    fs_1.default.mkdirSync(outputDir);
}
function writeMetadata(outputDir, metadata) {
    console.log('Clearing output directory');
    clearDirectory(outputDir);
    console.log('Writing output metadata');
    writeFile([outputDir, 'version.yaml'], {
        version: metadata.version,
    });
    writeFile([outputDir, 'actions.yaml'], {
        actions: metadata.actions,
        custom_types: metadata.custom_types,
    });
    writeFile([outputDir, 'allow_list.yaml'], metadata.allowlist);
    writeFile([outputDir, 'cron_triggers.yaml'], metadata.cron_triggers);
    writeFile([outputDir, 'query_collections.yaml'], metadata.query_collections);
    writeFile([outputDir, 'remote_schemas.yaml'], metadata.remote_schemas);
    console.warn('writing out empty rest_endpoints.yaml file. TODO: fix this.');
    writeFile([outputDir, 'rest_endpoints.yaml'], []);
    fs_1.default.mkdirSync(path_1.default.join(outputDir, 'databases'));
    writeFile([outputDir, 'databases', 'databases.yaml'], metadata.sources.map(function (source) { return (__assign(__assign({}, source), { tables: "!include " + source.name + "/tables/tables.yaml" })); }));
    metadata.sources.forEach(function (source) {
        fs_1.default.mkdirSync(path_1.default.join(outputDir, 'databases', source.name));
        fs_1.default.mkdirSync(path_1.default.join(outputDir, 'databases', source.name, 'tables'));
        writeFile([outputDir, 'databases', source.name, 'tables', 'tables.yaml'], source.tables.map(function (table) { return "!include " + table.table.schema + "_" + table.table.name + ".yaml"; }));
        source.tables.forEach(function (table) {
            writeFile([
                outputDir,
                'databases',
                source.name,
                'tables',
                table.table.schema + "_" + table.table.name + ".yaml",
            ], table);
        });
    });
}
exports.writeMetadata = writeMetadata;
