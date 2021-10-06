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
exports.mergeConfig = void 0;
exports.mergeConfig = {
    conflictCheck: function (a, b) {
        return a.version !== b.version ? 'Mismatched metadata versions' : null;
    },
    merge: function (_a, children) {
        var s = _a[0];
        return (__assign({ version: s.version }, children));
    },
    object_children: {
        custom_types: {
            conflictCheck: function (a, b) { return null; },
            merge: function (cts, children) {
                var _a, _b, _c, _d;
                return ({
                    enums: (_a = children.enums) !== null && _a !== void 0 ? _a : [],
                    input_objects: (_b = children.input_objects) !== null && _b !== void 0 ? _b : [],
                    objects: (_c = children.objects) !== null && _c !== void 0 ? _c : [],
                    scalars: (_d = children.scalars) !== null && _d !== void 0 ? _d : [],
                });
            },
            array_children: {
                enums: {
                    identity: function (t) { return t.name; },
                    conflictCheck: function (a, b) {
                        return JSON.stringify(a) !== JSON.stringify(b)
                            ? "Mismatched type definitions\nType A " + JSON.stringify(a) + "\nType B " + JSON.stringify(b)
                            : null;
                    },
                    merge: function (_a) {
                        var t = _a[0];
                        return t;
                    },
                },
                input_objects: {
                    identity: function (t) { return t.name; },
                    conflictCheck: function (a, b) {
                        return JSON.stringify(a) !== JSON.stringify(b)
                            ? "Mismatched type definitions\nType A " + JSON.stringify(a) + "\nType B " + JSON.stringify(b)
                            : null;
                    },
                    merge: function (_a) {
                        var t = _a[0];
                        return t;
                    },
                },
                objects: {
                    identity: function (t) { return t.name; },
                    conflictCheck: function (a, b) { return null; },
                    merge: function (_a, c) {
                        var t = _a[0];
                        return (__assign(__assign({}, t), c));
                    },
                    array_children: {
                        relationships: {
                            identity: function (r) { return r.name; },
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a) !== JSON.stringify(b)
                                    ? "Mismatched relationship definitions on type\nRelation A " + JSON.stringify(a) + "\nRelation B " + JSON.stringify(b)
                                    : null;
                            },
                            merge: function (_a) {
                                var r = _a[0];
                                return r;
                            },
                        },
                    },
                },
                scalars: {
                    identity: function (t) { return t.name; },
                    conflictCheck: function (a, b) {
                        return JSON.stringify(a) !== JSON.stringify(b)
                            ? "Mismatched type definitions\nType A " + JSON.stringify(a) + "\nType B " + JSON.stringify(b)
                            : null;
                    },
                    merge: function (_a) {
                        var t = _a[0];
                        return t;
                    },
                },
            },
        },
    },
    array_children: {
        actions: {
            identity: function (a) { return a.name; },
            conflictCheck: function (a, b) {
                return JSON.stringify(a.definition) !== JSON.stringify(b.definition)
                    ? "Mismatched action definitions:\n    Action A " + JSON.stringify(a.definition) + "\n    Action B " + JSON.stringify(b.definition)
                    : null;
            },
            merge: function (actions, children) {
                return __assign({ name: actions[0].name, definition: actions[0].definition }, children);
            },
            array_children: {
                permissions: {
                    identity: function (p) { return p.role; },
                    conflictCheck: function (a, b) { return null; },
                    merge: function (_a) {
                        var p = _a[0];
                        return p;
                    },
                },
            },
        },
        sources: {
            identity: function (s) { return s.name; },
            conflictCheck: function (a, b) {
                return a.kind !== b.kind
                    ? "Mismatched source kinds\nSource A " + a.kind + "\nSource B " + b.kind
                    : null;
            },
            merge: function (_a, children) {
                var s = _a[0];
                return (__assign({ name: s.name, kind: s.kind, configuration: s.configuration }, children));
            },
            array_children: {
                tables: {
                    identity: function (t) { return t.table.schema + "." + t.table.name; },
                    conflictCheck: function (a, b) {
                        var errors = [];
                        // check for relationships with same name defined as array relationships on one table, and object relationship on the other, or vice versa
                        if (a.array_relationships && b.object_relationships) {
                            for (var _i = 0, _a = a.array_relationships; _i < _a.length; _i++) {
                                var aRelation = _a[_i];
                                for (var _b = 0, _c = b.object_relationships; _b < _c.length; _b++) {
                                    var bRelation = _c[_b];
                                    if (aRelation.name === bRelation.name) {
                                        errors.push("Relation " + aRelation.name + " defined as array relation on table A but object relation on table B");
                                    }
                                }
                            }
                        }
                        if (a.object_relationships && b.array_relationships) {
                            for (var _d = 0, _e = a.object_relationships; _d < _e.length; _d++) {
                                var aRelation = _e[_d];
                                for (var _f = 0, _g = b.array_relationships; _f < _g.length; _f++) {
                                    var bRelation = _g[_f];
                                    if (aRelation.name === bRelation.name) {
                                        errors.push("Relation " + aRelation.name + " defined as object relation on table A but array relation on table B");
                                    }
                                }
                            }
                        }
                        return errors.length ? errors : null;
                    },
                    merge: function (_a, children) {
                        var t = _a[0];
                        return (__assign({ table: t.table }, children));
                    },
                    array_children: {
                        array_relationships: {
                            identity: function (a) { return a.name; },
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.using) !== JSON.stringify(b.using)
                                    ? "Mismatched relationship definitions:\nRelation A " + JSON.stringify(a.using) + "\nRelation B " + JSON.stringify(b.using)
                                    : null;
                            },
                            merge: function (_a, children) {
                                var a = _a[0];
                                return (__assign({ name: a.name, using: a.using }, children));
                            },
                        },
                        object_relationships: {
                            identity: function (a) { return a.name; },
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.using) !== JSON.stringify(b.using)
                                    ? "Mismatched relationship definitions:\nRelation A " + JSON.stringify(a.using) + "\nRelation B " + JSON.stringify(b.using)
                                    : null;
                            },
                            merge: function (_a, children) {
                                var a = _a[0];
                                return (__assign({ name: a.name, using: a.using }, children));
                            },
                        },
                        select_permissions: {
                            identity: function (p) { return p.role; },
                            // conflict if permissions mismatch whatsoever
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                                    ? "Mismatched permission definition:\nPermissions A " + JSON.stringify(a.permission) + "\nPermissions B " + JSON.stringify(b.permission)
                                    : null;
                            },
                            // if comments are different, concatenate
                            merge: function (_a) {
                                var p = _a[0], ps = _a.slice(1);
                                return ({
                                    role: p.role,
                                    permission: p.permission,
                                    comment: __spreadArray([p], ps, true).map(function (_a) {
                                        var comment = _a.comment;
                                        return comment;
                                    })
                                        .filter(function (comment) { return comment; })
                                        .join(', '),
                                });
                            },
                        },
                        insert_permissions: {
                            identity: function (p) { return p.role; },
                            // conflict if permissions mismatch whatsoever
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                                    ? "Mismatched permission definition:\nPermissions A " + JSON.stringify(a.permission) + "\nPermissions B " + JSON.stringify(b.permission)
                                    : null;
                            },
                            // if comments are different, concatenate
                            merge: function (_a) {
                                var p = _a[0], ps = _a.slice(1);
                                return ({
                                    role: p.role,
                                    permission: p.permission,
                                    comment: __spreadArray([p], ps, true).map(function (_a) {
                                        var comment = _a.comment;
                                        return comment;
                                    })
                                        .filter(function (comment) { return comment; })
                                        .join(', '),
                                });
                            },
                        },
                        update_permissions: {
                            identity: function (p) { return p.role; },
                            // conflict if permissions mismatch whatsoever
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                                    ? "Mismatched permission definition:\nPermissions A " + JSON.stringify(a.permission) + "\nPermissions B " + JSON.stringify(b.permission)
                                    : null;
                            },
                            // if comments are different, concatenate
                            merge: function (_a) {
                                var p = _a[0], ps = _a.slice(1);
                                return ({
                                    role: p.role,
                                    permission: p.permission,
                                    comment: __spreadArray([p], ps, true).map(function (_a) {
                                        var comment = _a.comment;
                                        return comment;
                                    })
                                        .filter(function (comment) { return comment; })
                                        .join(', '),
                                });
                            },
                        },
                        delete_permissions: {
                            identity: function (p) { return p.role; },
                            // conflict if permissions mismatch whatsoever
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                                    ? "Mismatched permission definition:\nPermissions A " + JSON.stringify(a.permission) + "\nPermissions B " + JSON.stringify(b.permission)
                                    : null;
                            },
                            // if comments are different, concatenate
                            merge: function (_a) {
                                var p = _a[0], ps = _a.slice(1);
                                return ({
                                    role: p.role,
                                    permission: p.permission,
                                    comment: __spreadArray([p], ps, true).map(function (_a) {
                                        var comment = _a.comment;
                                        return comment;
                                    })
                                        .filter(function (comment) { return comment; })
                                        .join(', '),
                                });
                            },
                        },
                    },
                },
            },
        },
    },
};
