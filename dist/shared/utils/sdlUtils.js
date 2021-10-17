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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSdlComplete = exports.getAllTypesFromSdl = exports.getAllActionsFromSdl = exports.getServerTypesFromSdl = exports.getActionDefinitionSdl = exports.getTypesSdl = exports.getActionDefinitionFromSdl = exports.getTypesFromSdl = exports.getTypeFromAstDef = exports.isValidOperationName = void 0;
var parser_1 = require("graphql/language/parser");
var wrappingTypeUtils_1 = require("./wrappingTypeUtils");
var hasuraCustomTypeUtils_1 = require("./hasuraCustomTypeUtils");
var isValidOperationName = function (operationName) {
    return operationName === 'query' || operationName === 'mutation';
};
exports.isValidOperationName = isValidOperationName;
var isValidOperationType = function (operationType) {
    return operationType === 'Mutation' || operationType === 'Query';
};
var getActionTypeFromOperationType = function (operationType) {
    if (operationType === 'Query') {
        return 'query';
    }
    return 'mutation';
};
var getOperationTypeFromActionType = function (operationType) {
    if (operationType === 'query') {
        return 'Query';
    }
    return 'Mutation';
};
var getAstEntityDescription = function (def) {
    return def.description ? def.description.value.trim() : null;
};
var getEntityDescriptionSdl = function (def) {
    var entityDescription = def.description;
    entityDescription = entityDescription ? "\"\"\" " + entityDescription + " \"\"\" " : '';
    return entityDescription;
};
var getTypeFromAstDef = function (astDef) {
    var handleScalar = function (def) {
        return {
            name: def.name.value,
            description: getAstEntityDescription(def),
            kind: 'scalar',
        };
    };
    var handleEnum = function (def) {
        return {
            name: def.name.value,
            kind: 'enum',
            description: getAstEntityDescription(def),
            values: def.values.map(function (v) { return ({
                value: v.name.value,
                description: getAstEntityDescription(v),
            }); }),
        };
    };
    var handleInputObject = function (def) {
        return {
            name: def.name.value,
            kind: 'input_object',
            description: getAstEntityDescription(def),
            fields: def.fields.map(function (f) {
                var fieldTypeMetadata = (0, wrappingTypeUtils_1.getAstTypeMetadata)(f.type);
                return {
                    name: f.name.value,
                    type: (0, wrappingTypeUtils_1.wrapTypename)(fieldTypeMetadata.typename, fieldTypeMetadata.stack),
                    description: getAstEntityDescription(f),
                };
            }),
        };
    };
    var handleObject = function (def) {
        return {
            name: def.name.value,
            kind: 'object',
            description: getAstEntityDescription(def),
            fields: def.fields.map(function (f) {
                var fieldTypeMetadata = (0, wrappingTypeUtils_1.getAstTypeMetadata)(f.type);
                return {
                    name: f.name.value,
                    type: (0, wrappingTypeUtils_1.wrapTypename)(fieldTypeMetadata.typename, fieldTypeMetadata.stack),
                    description: getAstEntityDescription(f),
                };
            }),
        };
    };
    switch (astDef.kind) {
        case 'ScalarTypeDefinition':
            return handleScalar(astDef);
        case 'EnumTypeDefinition':
            return handleEnum(astDef);
        case 'InputObjectTypeDefinition':
            return handleInputObject(astDef);
        case 'ObjectTypeDefinition':
            return handleObject(astDef);
        case 'SchemaDefinition':
            return {
                error: 'You cannot have schema definitions in Action/Type definitions',
            };
        case 'InterfaceTypeDefinition':
            return {
                error: 'Interface types are not supported',
            };
        default:
            return;
    }
};
exports.getTypeFromAstDef = getTypeFromAstDef;
var getTypesFromSdl = function (sdl) {
    var typeDefinition = {
        types: [],
        error: null,
    };
    if (!sdl || (sdl && sdl.trim() === '')) {
        return typeDefinition;
    }
    var schemaAst = (0, parser_1.parse)(sdl);
    schemaAst.definitions.forEach(function (def) {
        var typeDef = (0, exports.getTypeFromAstDef)(def);
        typeDefinition.error = typeDef.error;
        typeDefinition.types.push(typeDef);
    });
    return typeDefinition;
};
exports.getTypesFromSdl = getTypesFromSdl;
var getActionFromOperationAstDef = function (astDef) {
    var definition = {
        name: '',
        arguments: [],
        outputType: '',
        comment: getAstEntityDescription(astDef),
        error: null,
    };
    definition.name = astDef.name.value;
    var outputTypeMetadata = (0, wrappingTypeUtils_1.getAstTypeMetadata)(astDef.type);
    definition.outputType = (0, wrappingTypeUtils_1.wrapTypename)(outputTypeMetadata.typename, outputTypeMetadata.stack);
    definition.arguments = astDef.arguments.map(function (a) {
        var argTypeMetadata = (0, wrappingTypeUtils_1.getAstTypeMetadata)(a.type);
        return {
            name: a.name.value,
            type: (0, wrappingTypeUtils_1.wrapTypename)(argTypeMetadata.typename, argTypeMetadata.stack),
            description: getAstEntityDescription(a),
        };
    });
    return definition;
};
var getActionDefinitionFromSdl = function (sdl) {
    var definition = {
        name: '',
        arguments: [],
        outputType: '',
        comment: '',
        error: null,
    };
    var schemaAst;
    try {
        schemaAst = (0, parser_1.parse)(sdl);
    }
    catch (_a) {
        definition.error = 'Invalid SDL';
        return definition;
    }
    if (schemaAst.definitions.length > 1) {
        definition.error =
            'Action must be defined under a single "Mutation" type or a "Query" type';
        return definition;
    }
    var sdlDef = schemaAst.definitions[0];
    if (!isValidOperationType(sdlDef.name.value)) {
        definition.error =
            'Action must be defined under a "Mutation" or a "Query" type';
        return definition;
    }
    var actionType = getActionTypeFromOperationType(sdlDef.name.value);
    if (sdlDef.fields.length > 1) {
        var definedActions = sdlDef.fields
            .map(function (f) { return "\"" + f.name.value + "\""; })
            .join(', ');
        definition.error = "You have defined multiple actions (" + definedActions + "). Please define only one.";
        return definition;
    }
    var defObj = sdlDef.fields.length
        ? __assign(__assign(__assign({}, definition), { type: actionType }), getActionFromOperationAstDef(sdlDef.fields[0])) : __assign(__assign({}, definition), { type: actionType });
    return defObj;
};
exports.getActionDefinitionFromSdl = getActionDefinitionFromSdl;
var getArgumentsSdl = function (args) {
    if (!args.length)
        return '';
    var argsSdl = args.map(function (a) {
        return "    " + getEntityDescriptionSdl(a) + a.name + ": " + a.type;
    });
    return "(\n" + argsSdl.join('\n') + "\n  )";
};
var getFieldsSdl = function (fields) {
    var fieldsSdl = fields.map(function (f) {
        var argSdl = f.arguments ? getArgumentsSdl(f.arguments) : '';
        return "  " + getEntityDescriptionSdl(f) + f.name + argSdl + ": " + f.type;
    });
    return fieldsSdl.join('\n');
};
var getObjectTypeSdl = function (type) {
    return getEntityDescriptionSdl(type) + "type " + type.name + " {\n" + getFieldsSdl(type.fields) + "\n}\n\n";
};
var getInputTypeSdl = function (type) {
    return getEntityDescriptionSdl(type) + "input " + type.name + " {\n" + getFieldsSdl(type.fields) + "\n}\n\n";
};
var getScalarTypeSdl = function (type) {
    return getEntityDescriptionSdl(type) + "scalar " + type.name + "\n\n";
};
var getEnumTypeSdl = function (type) {
    var enumValuesSdl = type.values.map(function (v) {
        return "  " + getEntityDescriptionSdl(v) + v.value;
    });
    return getEntityDescriptionSdl(type) + "enum " + type.name + " {\n" + enumValuesSdl.join('\n') + "\n}\n\n";
};
var getTypeSdl = function (type) {
    if (!type)
        return '';
    switch (type.kind) {
        case 'scalar':
            return getScalarTypeSdl(type);
        case 'enum':
            return getEnumTypeSdl(type);
        case 'input_object':
            return getInputTypeSdl(type);
        case 'object':
            return getObjectTypeSdl(type);
        default:
            return '';
    }
};
var getTypesSdl = function (_types) {
    var types = _types;
    if (types.constructor.name !== 'Array') {
        types = (0, hasuraCustomTypeUtils_1.parseCustomTypes)(_types);
    }
    var sdl = '';
    types.forEach(function (t) {
        sdl += getTypeSdl(t);
    });
    return sdl;
};
exports.getTypesSdl = getTypesSdl;
var getActionDefinitionSdl = function (name, actionType, args, outputType, description) {
    return getObjectTypeSdl({
        name: getOperationTypeFromActionType(actionType),
        fields: [
            {
                name: name,
                arguments: args,
                type: outputType,
                description: description,
            },
        ],
    });
};
exports.getActionDefinitionSdl = getActionDefinitionSdl;
var getServerTypesFromSdl = function (sdl, existingTypes) {
    var _a = (0, exports.getTypesFromSdl)(sdl), typesFromSdl = _a.types, error = _a.error;
    return {
        types: (0, hasuraCustomTypeUtils_1.reformCustomTypes)((0, hasuraCustomTypeUtils_1.hydrateTypeRelationships)(typesFromSdl, (0, hasuraCustomTypeUtils_1.parseCustomTypes)(existingTypes))),
        error: error,
    };
};
exports.getServerTypesFromSdl = getServerTypesFromSdl;
var getAllActionsFromSdl = function (sdl) {
    var ast = (0, parser_1.parse)(sdl);
    var actions = [];
    ast.definitions
        .filter(function (d) { return isValidOperationType(d.name.value); })
        .forEach(function (d) {
        d.fields.forEach(function (f) {
            var action = getActionFromOperationAstDef(f);
            actions.push({
                name: action.name,
                definition: {
                    type: getActionTypeFromOperationType(d.name.value),
                    arguments: action.arguments,
                    output_type: action.outputType,
                },
            });
        });
    });
    return actions;
};
exports.getAllActionsFromSdl = getAllActionsFromSdl;
var getAllTypesFromSdl = function (sdl) {
    var ast = (0, parser_1.parse)(sdl);
    ast.definitions = ast.definitions.filter(function (d) { return !isValidOperationType(d.name.value); });
    var types = ast.definitions.map(function (d) {
        return (0, exports.getTypeFromAstDef)(d);
    });
    return (0, hasuraCustomTypeUtils_1.reformCustomTypes)(types);
};
exports.getAllTypesFromSdl = getAllTypesFromSdl;
var getSdlComplete = function (allActions, allTypes) {
    var sdl = '';
    allActions.forEach(function (a) {
        sdl += "extend " + (0, exports.getActionDefinitionSdl)(a.name, a.definition.type, a.definition.arguments, a.definition.output_type, a.comment);
    });
    sdl += (0, exports.getTypesSdl)(allTypes);
    return sdl;
};
exports.getSdlComplete = getSdlComplete;
