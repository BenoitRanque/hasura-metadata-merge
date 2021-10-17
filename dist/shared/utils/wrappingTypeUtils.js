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
exports.wrapTypename = exports.getSchemaTypeMetadata = exports.getAstTypeMetadata = exports.unwrapType = void 0;
var graphql_1 = require("graphql");
var unwrapNonNullable = function (wrappedTypename) {
    return wrappedTypename.substring(0, wrappedTypename.length - 1);
};
var unwrapList = function (wrappedTypename) {
    return wrappedTypename.substring(1, wrappedTypename.length - 1);
};
var unwrapType = function (wrappedTypename) {
    var typename = wrappedTypename;
    var typeWrapperStack = [];
    var lastChar = typename.charAt(typename.length - 1);
    while (lastChar) {
        if (lastChar === ']') {
            typename = unwrapList(typename);
            typeWrapperStack.push('l');
        }
        else if (lastChar === '!') {
            typename = unwrapNonNullable(typename);
            typeWrapperStack.push('n');
        }
        else {
            break;
        }
        lastChar = typename.charAt(typename.length - 1);
    }
    return {
        stack: typeWrapperStack,
        typename: typename,
    };
};
exports.unwrapType = unwrapType;
var getAstTypeMetadata = function (type) {
    var node = __assign({}, type);
    var typewraps = [];
    while (node.kind !== 'NamedType') {
        if (node.kind === 'ListType') {
            typewraps.push('l');
        }
        if (node.kind === 'NonNullType') {
            typewraps.push('n');
        }
        node = node.type;
    }
    var typename = node.name.value;
    return {
        typename: typename,
        stack: typewraps,
    };
};
exports.getAstTypeMetadata = getAstTypeMetadata;
var getSchemaTypeMetadata = function (type) {
    var t = type;
    var typewraps = [];
    while ((0, graphql_1.isWrappingType)(t)) {
        if ((0, graphql_1.isListType)(t)) {
            typewraps.push('l');
        }
        if ((0, graphql_1.isNonNullType)(t)) {
            typewraps.push('n');
        }
        t = t.ofType;
    }
    return {
        typename: t.name,
        stack: typewraps,
    };
};
exports.getSchemaTypeMetadata = getSchemaTypeMetadata;
var wrapTypename = function (name, wrapperStack) {
    var wrappedTypename = name;
    wrapperStack.reverse().forEach(function (w) {
        if (w === 'l') {
            wrappedTypename = "[" + wrappedTypename + "]";
        }
        if (w === 'n') {
            wrappedTypename = wrappedTypename + "!";
        }
    });
    return wrappedTypename;
};
exports.wrapTypename = wrapTypename;
