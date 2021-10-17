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
exports.readMetadata = exports.readActions = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var js_yaml_1 = __importDefault(require("js-yaml"));
var sdlUtils_1 = require("./shared/utils/sdlUtils");
var hasuraCustomTypeUtils_1 = require("./shared/utils/hasuraCustomTypeUtils");
function readFileOptional(inputPath, yamlLoad) {
    if (yamlLoad === void 0) { yamlLoad = true; }
    if (!fs_1.default.existsSync(path_1.default.join.apply(path_1.default, inputPath))) {
        return undefined;
    }
    return readFile(inputPath, yamlLoad);
}
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
        var functionList = source.functions
            ? readFile([
                inputDir,
                'databases',
                source.name,
                'functions',
                'functions.yaml',
            ])
            : undefined;
        var functions = functionList
            ? functionList.map(function (fnPath) {
                var fn = readFile([
                    inputDir,
                    'databases',
                    source.name,
                    'functions',
                    fnPath.replace('!include ', ''),
                ]);
                return fn;
            })
            : undefined;
        return __assign(__assign({}, source), { tables: tables, functions: functions });
    });
}
function mergeByName(sdlArr, ymlArr, handleSDLDuplicateError, handleYMLDuplicateError, handleMissingFromSDLError, handleMissingFromYMLError, merge) {
    if (sdlArr === void 0) { sdlArr = []; }
    if (ymlArr === void 0) { ymlArr = []; }
    if (merge === void 0) { merge = function (sdl, yml) { return (__assign(__assign({}, sdl), yml)); }; }
    // if both sources empty, return empty array
    if (sdlArr.length === 0 && ymlArr.length === 0) {
        return [];
    }
    // dictionary to store elements to merge
    var dictionary = {};
    // map sdl items to dictionary and check for duplicates
    for (var _i = 0, sdlArr_1 = sdlArr; _i < sdlArr_1.length; _i++) {
        var sdlItem = sdlArr_1[_i];
        if (!dictionary[sdlItem.name]) {
            dictionary[sdlItem.name] = {};
        }
        if (dictionary[sdlItem.name].sdl) {
            // item already in dictionary, handle duplicate error
            handleSDLDuplicateError(sdlItem);
        }
        else {
            dictionary[sdlItem.name].sdl = sdlItem;
        }
    }
    // map yml items to dictionary and check for duplicates
    for (var _a = 0, ymlArr_1 = ymlArr; _a < ymlArr_1.length; _a++) {
        var ymlItem = ymlArr_1[_a];
        if (!dictionary[ymlItem.name]) {
            dictionary[ymlItem.name] = {};
        }
        if (dictionary[ymlItem.name].yml) {
            // item already in dictionary, handle duplicate error
            handleYMLDuplicateError(ymlItem);
        }
        else {
            dictionary[ymlItem.name].yml = ymlItem;
        }
    }
    for (var _b = 0, _c = Object.values(dictionary); _b < _c.length; _b++) {
        var item = _c[_b];
        // check if item missing from either side
        if (item.yml && !item.sdl)
            handleMissingFromSDLError(item.yml);
        if (!item.yml && item.sdl)
            handleMissingFromYMLError(item.sdl);
    }
    // once validated, coherce the type to make fields as required.
    var validatedDictionary = dictionary;
    return Object.values(validatedDictionary).map(function (_a) {
        var sdl = _a.sdl, yml = _a.yml;
        return merge(sdl, yml);
    });
}
function readActions(inputDir) {
    var errors = [];
    var sdl = readFile([inputDir, 'actions.graphql'], false);
    if (!sdl.trim().length) {
        return {
            actions: [],
            custom_types: (0, hasuraCustomTypeUtils_1.reformCustomTypes)([]),
        };
    }
    var customTypesFromSDL = (0, sdlUtils_1.getAllTypesFromSdl)(sdl);
    var actionsFromSDL = (0, sdlUtils_1.getAllActionsFromSdl)(sdl);
    var _a = readFile([inputDir, 'actions.yaml']), actionsFromYAML = _a.actions, customTypesFromYAML = _a.custom_types;
    var actions = mergeByName(actionsFromSDL, actionsFromYAML, function (duplicate) {
        return errors.push("Duplicate action " + duplicate.name + " in actions.graphql in " + inputDir);
    }, function (duplicate) {
        return errors.push("Duplicate action " + duplicate.name + " in actions.yaml in " + inputDir);
    }, function (missing) {
        return errors.push("Missing action " + missing.name + " in actions.graphql (defined in actions.yaml) in " + inputDir);
    }, function (missing) {
        return errors.push("Missing action " + missing.name + " in actions.yaml (defined in actions.graphql) in " + inputDir);
    }, function (sdl, yml) { return (__assign(__assign(__assign({}, sdl), yml), { definition: __assign(__assign({}, sdl.definition), yml.definition) })); });
    var enums = mergeByName(customTypesFromSDL.enums, customTypesFromYAML.enums, function (duplicate) {
        return errors.push("Duplicate enum " + duplicate.name + " in actions.graphql in " + inputDir);
    }, function (duplicate) {
        return errors.push("Duplicate enum " + duplicate.name + " in actions.yaml in " + inputDir);
    }, function (missing) {
        return errors.push("Missing enum " + missing.name + " in actions.graphql (defined in actions.yaml) in " + inputDir);
    }, function (missing) {
        return errors.push("Missing enum " + missing.name + " in actions.yaml (defined in actions.graphql) in " + inputDir);
    });
    var input_objects = mergeByName(customTypesFromSDL.input_objects, customTypesFromYAML.input_objects, function (duplicate) {
        return errors.push("Duplicate input_object " + duplicate.name + " in actions.graphql in " + inputDir);
    }, function (duplicate) {
        return errors.push("Duplicate input_object " + duplicate.name + " in actions.yaml in " + inputDir);
    }, function (missing) {
        return errors.push("Missing input_object " + missing.name + " in actions.graphql (defined in actions.yaml) in " + inputDir);
    }, function (missing) {
        return errors.push("Missing input_object " + missing.name + " in actions.yaml (defined in actions.graphql) in " + inputDir);
    });
    var objects = mergeByName(customTypesFromSDL.objects, customTypesFromYAML.objects, function (duplicate) {
        return errors.push("Duplicate object " + duplicate.name + " in actions.graphql in " + inputDir);
    }, function (duplicate) {
        return errors.push("Duplicate object " + duplicate.name + " in actions.yaml in " + inputDir);
    }, function (missing) {
        return errors.push("Missing object " + missing.name + " in actions.graphql (defined in actions.yaml) in " + inputDir);
    }, function (missing) {
        return errors.push("Missing object " + missing.name + " in actions.yaml (defined in actions.graphql) in " + inputDir);
    });
    var scalars = mergeByName(customTypesFromSDL.scalars, customTypesFromYAML.scalars, function (duplicate) {
        return errors.push("Duplicate object " + duplicate.name + " in actions.graphql in " + inputDir);
    }, function (duplicate) {
        return errors.push("Duplicate object " + duplicate.name + " in actions.yaml in " + inputDir);
    }, function (missing) {
        return errors.push("Missing object " + missing.name + " in actions.graphql (defined in actions.yaml) in " + inputDir);
    }, function (missing) {
        return errors.push("Missing object " + missing.name + " in actions.yaml (defined in actions.graphql) in " + inputDir);
    });
    if (errors.length) {
        errors.forEach(console.log);
        throw new Error("Errors encountered reading actions metadata in " + inputDir + ". See log output above");
    }
    return {
        actions: actions,
        custom_types: {
            enums: enums,
            input_objects: input_objects,
            objects: objects,
            scalars: scalars,
        },
    };
}
exports.readActions = readActions;
function readMetadata(inputDir) {
    var version = readFile([inputDir, 'version.yaml']);
    if (!version || version.version !== 3) {
        throw new Error("Incompatible metadata version in directory " + inputDir + ". Expected 3, got " + version);
    }
    var _a = readActions(inputDir), actions = _a.actions, custom_types = _a.custom_types;
    var metadata = {
        version: 3,
        actions: actions,
        custom_types: custom_types,
        allowlist: readFile([inputDir, 'allow_list.yaml']),
        cron_triggers: readFile([inputDir, 'cron_triggers.yaml']),
        query_collections: readFile([
            inputDir,
            'query_collections.yaml',
        ]),
        remote_schemas: readFile([
            inputDir,
            'remote_schemas.yaml',
        ]),
        rest_endpoints: readFile([
            inputDir,
            'rest_endpoints.yaml',
        ]),
        sources: readSources(inputDir),
        api_limits: readFileOptional([inputDir, 'api_limits.yaml']),
        inherited_roles: readFileOptional([inputDir, 'inherited_roles.yaml']),
    };
    return metadata;
}
exports.readMetadata = readMetadata;
