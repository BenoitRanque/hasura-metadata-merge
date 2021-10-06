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
exports.readMetadata = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var js_yaml_1 = __importDefault(require("js-yaml"));
function readFile(inputPath, yamlLoad) {
    if (yamlLoad === void 0) { yamlLoad = true; }
    try {
        var file = fs_1.default.readFileSync(path_1.default.join.apply(path_1.default, inputPath)).toString();
        return yamlLoad ? js_yaml_1.default.load(file) : file;
    }
    catch (error) {
        throw error;
    }
}
function readSources(inputDir) {
    var sources = readFile([
        inputDir,
        'databases',
        'databases.yaml',
    ]);
    return sources.map(function (source) {
        var tableList = readFile([
            inputDir,
            'databases',
            source.name,
            'tables',
            'tables.yaml',
        ]);
        var tables = tableList.map(function (tablePath) {
            var table = readFile([
                inputDir,
                'databases',
                source.name,
                'tables',
                tablePath.replace('!include ', ''),
            ]);
            return table;
        });
        // todo: read functions
        return __assign(__assign({}, source), { tables: tables });
    });
}
function readMetadata(inputDir) {
    var version = readFile([inputDir, 'version.yaml']);
    if (!version || version.version !== 3) {
        throw new Error("Incompatible metadata version in directory " + inputDir + ". Expected 3, got " + version);
    }
    var _a = readFile([inputDir, 'actions.yaml']), actions = _a.actions, custom_types = _a.custom_types;
    var metadata = {
        version: 3,
        // todo: include custom types from actions.graphql, and check them for duplicates
        // throw error if any types have the same names but are not the same.
        // if no errors are present, conatenate types into a single .graphql file
        // unsure if custom types should be property of top level metadata, actions property, or standalone.
        actions: actions,
        custom_types: custom_types,
        allowlist: readFile([inputDir, 'allow_list.yaml']),
        cron_triggers: readFile([inputDir, 'cron_triggers.yaml']),
        query_collections: readFile([
            inputDir,
            'cron_triggers.yaml',
        ]),
        remote_schemas: readFile([
            inputDir,
            'remote_schemas.yaml',
        ]),
        // TODO: add typing for rest_endpoints
        // rest_endpoints: yaml.load(
        //   readFile(path.join(inputDir, "rest_endpoints.yaml"))
        // ) as RestEnpoints[],
        sources: readSources(inputDir),
    };
    return metadata;
}
exports.readMetadata = readMetadata;
