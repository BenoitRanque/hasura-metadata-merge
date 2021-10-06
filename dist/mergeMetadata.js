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
exports.logMergeErrors = exports.mergeMetadata = void 0;
function mergeMetadataObjects(sources, config, location, errors) {
    // check for conflicts against every other object of the same type
    sources.forEach(function (_a, index) {
        var originA = _a[0], sourceA = _a[1];
        if (sources.length > index + 1) {
            sources.slice(index + 1).forEach(function (_a) {
                var originB = _a[0], sourceB = _a[1];
                var conflictMessages = config.conflictCheck(sourceA, sourceB);
                if (conflictMessages) {
                    if (Array.isArray(conflictMessages)) {
                        conflictMessages.forEach(function (message) {
                            errors.push({
                                location: location,
                                originA: originA,
                                originB: originB,
                                message: message,
                            });
                        });
                    }
                    else {
                        errors.push({
                            location: location,
                            originA: originA,
                            originB: originB,
                            message: conflictMessages,
                        });
                    }
                }
            });
        }
    });
    var array_children = !config.array_children
        ? {}
        : Object.fromEntries(Object.keys(config.array_children).map(function (key) {
            var childKey = key;
            var childConfig = config.array_children[childKey];
            var mergedArrays = mergeMetadataArrays(sources, childKey, childConfig, location, errors);
            return [key, mergedArrays.length ? mergedArrays : undefined];
        }));
    var object_children = !config.object_children
        ? {}
        : Object.fromEntries(Object.keys(config.object_children).map(function (key) {
            var childKey = key;
            var childConfig = config.object_children[childKey];
            var childSources = sources.reduce(function (acc, _a) {
                var origin = _a[0], parentSource = _a[1];
                if (parentSource[childKey]) {
                    acc.push([origin, parentSource[childKey]]);
                }
                return acc;
            }, []);
            return [
                key,
                childSources.length
                    ? mergeMetadataObjects(childSources, childConfig, __spreadArray(__spreadArray([], location, true), [childKey], false), errors)
                    : undefined,
            ];
        }));
    return config.merge(__spreadArray([sources[0][1]], sources.slice(1).map(function (_a) {
        var origin = _a[0], source = _a[1];
        return source;
    }), true), __assign(__assign({}, array_children), object_children));
}
function mergeMetadataArrays(sources, key, config, location, errors) {
    var dictionary = {};
    sources.forEach(function (_a) {
        var origin = _a[0], source = _a[1];
        var childCollection = source[key];
        if (childCollection) {
            childCollection.forEach(function (child) {
                var id = config.identity(child);
                if (!dictionary[id]) {
                    dictionary[id] = [];
                }
                dictionary[id].push([origin, child]);
            });
        }
    });
    return Object.entries(dictionary).map(function (_a) {
        var id = _a[0], childSources = _a[1];
        return mergeMetadataObjects(childSources, config, __spreadArray(__spreadArray([], location, true), [key, id], false), errors);
    });
}
function mergeMetadata(sources, config) {
    // errors will be modified by reference
    var errors = [];
    var metadata = mergeMetadataObjects(sources, config, [], errors);
    return { metadata: metadata, errors: errors };
}
exports.mergeMetadata = mergeMetadata;
function logMergeErrors(errors) {
    console.log('The following errors where encountered while attempting to merge metadata:');
    errors.forEach(function (error) {
        console.log("location: " + error.location.join('.') + "\n" + error.message + "\norigin A " + error.originA + "\norigin B " + error.originB + "\n");
    });
}
exports.logMergeErrors = logMergeErrors;
