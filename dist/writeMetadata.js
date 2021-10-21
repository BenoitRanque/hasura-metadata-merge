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
var sdlUtils_1 = require("./shared/utils/sdlUtils");
var hasuraCustomTypeUtils_1 = require("./shared/utils/hasuraCustomTypeUtils");
function writeFile(outputPath, file, yamlDump) {
    if (yamlDump === void 0) { yamlDump = true; }
    try {
        fs_1.default.writeFileSync(path_1.default.join.apply(path_1.default, outputPath), yamlDump
            ? js_yaml_1.default.dump(file, { noArrayIndent: true, quotingType: "'" })
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
function writeActions(outputDir, _a) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var _k = _a.actions, actions = _k === void 0 ? [] : _k, _l = _a.custom_types, custom_types = _l === void 0 ? (0, hasuraCustomTypeUtils_1.reformCustomTypes)([]) : _l;
    var sdl = actions
        .map(function (a) {
        return (0, sdlUtils_1.getActionDefinitionSdl)(a.name, a.definition.type, a.definition.arguments, a.definition.output_type, a.comment);
    })
        .concat([(0, sdlUtils_1.getTypesSdl)(custom_types)])
        .join('');
    writeFile([outputDir, 'actions.graphql'], sdl, false);
    // remove data that does not belong in actions.yaml
    var ymlPayload = {
        actions: actions.map(function (action) {
            delete action.definition.type;
            delete action.definition.arguments;
            delete action.definition.output_type;
            return action;
        }),
        custom_types: {
            enums: (_c = (_b = custom_types.enums) === null || _b === void 0 ? void 0 : _b.map(function (_a) {
                var name = _a.name, description = _a.description;
                return ({
                    name: name,
                    description: description,
                });
            })) !== null && _c !== void 0 ? _c : [],
            input_objects: (_e = (_d = custom_types.input_objects) === null || _d === void 0 ? void 0 : _d.map(function (_a) {
                var name = _a.name, description = _a.description;
                return ({
                    name: name,
                    description: description,
                });
            })) !== null && _e !== void 0 ? _e : [],
            objects: (_g = (_f = custom_types.objects) === null || _f === void 0 ? void 0 : _f.map(function (_a) {
                var name = _a.name, description = _a.description, relationships = _a.relationships;
                return ({
                    name: name,
                    description: description,
                    relationships: relationships,
                });
            })) !== null && _g !== void 0 ? _g : [],
            scalars: (_j = (_h = custom_types.scalars) === null || _h === void 0 ? void 0 : _h.map(function (_a) {
                var name = _a.name, description = _a.description;
                return ({
                    name: name,
                    description: description,
                });
            })) !== null && _j !== void 0 ? _j : [],
        },
    };
    writeFile([outputDir, 'actions.yaml'], ymlPayload);
}
function writeMetadata(outputDir, metadata) {
    console.log('Clearing output directory');
    clearDirectory(outputDir);
    console.log('Writing output metadata');
    writeFile([outputDir, 'version.yaml'], {
        version: metadata.version,
    });
    writeActions(outputDir, {
        actions: metadata.actions,
        custom_types: metadata.custom_types,
    });
    writeFile([outputDir, 'allow_list.yaml'], metadata.allowlist);
    writeFile([outputDir, 'cron_triggers.yaml'], metadata.cron_triggers);
    writeFile([outputDir, 'query_collections.yaml'], metadata.query_collections);
    writeFile([outputDir, 'remote_schemas.yaml'], metadata.remote_schemas);
    writeFile([outputDir, 'rest_endpoints.yaml'], metadata.rest_endpoints);
    if (metadata.api_limits) {
        writeFile([outputDir, 'api_limits.yaml'], metadata.api_limits);
    }
    if (metadata.inherited_roles) {
        writeFile([outputDir, 'inherited_roles.yaml'], metadata.inherited_roles);
    }
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
        if (source.functions) {
            fs_1.default.mkdirSync(path_1.default.join(outputDir, 'databases', source.name, 'functions'));
            writeFile([outputDir, 'databases', source.name, 'functions', 'functions.yaml'], source.functions.map(function (fn) {
                return typeof fn.function === 'string'
                    ? "!include " + fn.function + ".yaml"
                    : "!include " + fn.function.schema + "_" + fn.function.name + ".yaml";
            }));
            source.functions.forEach(function (fn) {
                writeFile([
                    outputDir,
                    'databases',
                    source.name,
                    typeof fn.function === 'string'
                        ? "!include " + fn.function + ".yaml"
                        : "!include " + fn.function.schema + "_" + fn.function.name + ".yaml",
                ], fn);
            });
        }
    });
}
exports.writeMetadata = writeMetadata;
