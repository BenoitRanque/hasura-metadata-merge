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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hydrateTypeRelationships = exports.getActionTypes = exports.parseCustomTypes = exports.reformCustomTypes = exports.mergeCustomTypes = exports.filterValueLess = exports.filterNameless = exports.filterNameLessTypeLess = exports.inbuiltTypes = void 0;
var wrappingTypeUtils_1 = require("./wrappingTypeUtils");
exports.inbuiltTypes = {
    Int: true,
    Boolean: true,
    String: true,
    Float: true,
    ID: true,
};
var singularize = function (kind) {
    return kind.substr(0, kind.length - 1);
};
var filterNameLessTypeLess = function (arr) {
    return arr.filter(function (item) { return !!item.name && !!item.type; });
};
exports.filterNameLessTypeLess = filterNameLessTypeLess;
var filterNameless = function (arr) {
    return arr.filter(function (item) { return !!item.name; });
};
exports.filterNameless = filterNameless;
var filterValueLess = function (arr) {
    return arr.filter(function (item) { return !!item.value; });
};
exports.filterValueLess = filterValueLess;
var mergeCustomTypes = function (newTypesList, existingTypesList) {
    var mergedTypes = __spreadArray([], existingTypesList, true);
    var overlappingTypenames = [];
    var existingTypeIndexMap = {};
    existingTypesList.forEach(function (et, i) {
        existingTypeIndexMap[et.name] = i;
    });
    newTypesList.forEach(function (nt) {
        if (existingTypeIndexMap[nt.name] !== undefined) {
            mergedTypes[existingTypeIndexMap[nt.name]] = nt;
            overlappingTypenames.push(nt.name);
        }
        else {
            mergedTypes.push(nt);
        }
    });
    return {
        types: mergedTypes,
        overlappingTypenames: overlappingTypenames,
    };
};
exports.mergeCustomTypes = mergeCustomTypes;
var reformCustomTypes = function (typesFromState) {
    var sanitisedTypes = [];
    typesFromState.forEach(function (t) {
        if (!t.name) {
            return;
        }
        var sanitisedType = __assign({}, t);
        if (t.fields) {
            sanitisedType.fields = (0, exports.filterNameLessTypeLess)(t.fields);
        }
        if (t.arguments) {
            sanitisedType.arguments = (0, exports.filterNameLessTypeLess)(t.arguments);
        }
        sanitisedTypes.push(sanitisedType);
    });
    var customTypes = {
        scalars: [],
        input_objects: [],
        objects: [],
        enums: [],
    };
    sanitisedTypes.forEach(function (_type) {
        var type = JSON.parse(JSON.stringify(_type));
        delete type.kind;
        switch (_type.kind) {
            case 'scalar':
                customTypes.scalars.push(type);
                return;
            case 'object':
                customTypes.objects.push(type);
                return;
            case 'input_object':
                customTypes.input_objects.push(type);
                return;
            case 'enum':
                customTypes.enums.push(type);
                return;
            default:
                return;
        }
    });
    return customTypes;
};
exports.reformCustomTypes = reformCustomTypes;
var parseCustomTypes = function (customTypesServer) {
    var customTypesClient = [];
    Object.keys(customTypesServer).forEach(function (tk) {
        var types = customTypesServer[tk];
        if (types) {
            types.forEach(function (t) {
                customTypesClient.push(__assign(__assign({}, t), { kind: singularize(tk) }));
            });
        }
    });
    return customTypesClient;
};
exports.parseCustomTypes = parseCustomTypes;
var getActionTypes = function (actionDef, allTypes) {
    var usedTypes = {};
    var actionTypes = [];
    var getDependentTypes = function (typename) {
        if (usedTypes[typename])
            return;
        var type = allTypes.find(function (t) { return t.name === typename; });
        if (!type)
            return;
        actionTypes.push(type);
        usedTypes[typename] = true;
        if (type.kind === 'input_object' || type.kind === 'object') {
            type.fields.forEach(function (f) {
                var _typename = (0, wrappingTypeUtils_1.unwrapType)(f.type).typename;
                getDependentTypes(_typename);
            });
        }
    };
    actionDef.arguments.forEach(function (a) {
        var typename = (0, wrappingTypeUtils_1.unwrapType)(a.type).typename;
        getDependentTypes(typename);
    });
    getDependentTypes(actionDef.output_type);
    return actionTypes;
};
exports.getActionTypes = getActionTypes;
var hydrateTypeRelationships = function (newTypes, existingTypes) {
    var typeMap = {};
    existingTypes.forEach(function (t) {
        typeMap[t.name] = t;
    });
    return newTypes.map(function (t) {
        if (t.kind === 'object' && typeMap[t.name]) {
            return __assign(__assign({}, t), (typeMap[t.name].relationships && {
                relationships: typeMap[t.name].relationships,
            }));
        }
        return t;
    });
};
exports.hydrateTypeRelationships = hydrateTypeRelationships;
