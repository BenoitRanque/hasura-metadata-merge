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
// utility to concatenate unique comment strings.
function concatenateComments(items) {
    var uniqueComments = Array.from(new Set(items
        .map(function (_a) {
        var comment = _a.comment;
        return comment;
    })
        .filter(function (s) { return !!s; })
        .map(function (s) { return s.trim(); })));
    return uniqueComments.length ? uniqueComments.join(', ') : undefined;
}
// utility to concatenate unique description strings.
function concatenateDescriptions(items) {
    var uniqueDescriptions = Array.from(new Set(items
        .map(function (_a) {
        var description = _a.description;
        return description;
    })
        .filter(function (s) { return !!s; })
        .map(function (s) { return s.trim(); })));
    return uniqueDescriptions.length ? uniqueDescriptions.join(', ') : undefined;
}
exports.mergeConfig = {
    conflictCheck: function (a, b) {
        return a.version !== b.version ? 'Mismatched metadata versions' : null;
    },
    merge: function (metadatas, children) {
        var _a, _b, _c, _d, _e;
        return ({
            version: metadatas[0].version,
            actions: children.actions,
            custom_types: children.custom_types,
            sources: children.sources,
            api_limits: children.api_limits,
            inherited_roles: children.inherited_roles,
            // merge function returns undefined for arrays that have no members.
            // this avoids polluting schema with empty keys
            // however top level items like thes should default to an empty array, so the file isn't empty
            // this behavior is consistent with cli behavior
            allowlist: (_a = children.allowlist) !== null && _a !== void 0 ? _a : [],
            rest_endpoints: (_b = children.rest_endpoints) !== null && _b !== void 0 ? _b : [],
            cron_triggers: (_c = children.cron_triggers) !== null && _c !== void 0 ? _c : [],
            query_collections: (_d = children.query_collections) !== null && _d !== void 0 ? _d : [],
            remote_schemas: (_e = children.remote_schemas) !== null && _e !== void 0 ? _e : [],
        });
    },
    object_children: {
        custom_types: {
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
                        return JSON.stringify(a.values) !== JSON.stringify(b.values)
                            ? "Mismatched type definitions\nType A " + JSON.stringify(a) + "\nType B " + JSON.stringify(b)
                            : null;
                    },
                    merge: function (enums) { return ({
                        name: enums[0].name,
                        values: enums[0].values,
                        description: concatenateDescriptions(enums),
                    }); },
                },
                input_objects: {
                    identity: function (t) { return t.name; },
                    conflictCheck: function (a, b) {
                        return JSON.stringify(a.fields) !== JSON.stringify(b.fields)
                            ? "Mismatched type definitions\nType A " + JSON.stringify(a) + "\nType B " + JSON.stringify(b)
                            : null;
                    },
                    merge: function (objects) { return ({
                        name: objects[0].name,
                        fields: objects[0].fields,
                        description: concatenateDescriptions(objects),
                    }); },
                },
                objects: {
                    identity: function (t) { return t.name; },
                    conflictCheck: function (a, b) {
                        return a.fields
                            .map(function (f) { return f.name; })
                            .sort()
                            .join(',') !==
                            b.fields
                                .map(function (f) { return f.name; })
                                .sort()
                                .join(',')
                            ? "Mismatched object type fields:\nObject A fields: " + a.fields.map(function (f) { return f.name; }).join(', ') + "\nObject B fields: " + b.fields.map(function (f) { return f.name; }).join(', ')
                            : null;
                    },
                    merge: function (objects, children) { return ({
                        name: objects[0].name,
                        fields: objects[0].fields,
                        description: concatenateDescriptions(objects),
                        relationships: children.relationships,
                    }); },
                    array_children: {
                        relationships: {
                            identity: function (r) { return r.name; },
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a) !== JSON.stringify(b)
                                    ? "Mismatched relationship definitions on type\nRelation A " + JSON.stringify(a) + "\nRelation B " + JSON.stringify(b)
                                    : null;
                            },
                        },
                        fields: {
                            identity: function (f) { return f.name; },
                            conflictCheck: function (a, b) {
                                return a.type !== b.type
                                    ? "Mismatched Types on field " + a.name + ":\nType A: " + a.type + "\nType B: " + b.type
                                    : null;
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
        api_limits: {
            conflictCheck: function (a, b) {
                return a.disabled !== b.disabled
                    ? "Mismatching \"disabled\" value for api limit\""
                    : null;
            },
            object_children: {
                depth_limit: {
                    conflictCheck: function (a, b) {
                        var errors = [];
                        // check if globals mismatch
                        if (a.global !== b.global) {
                            errors.push("Mismatching global value for depth limit of api limits:\nGlobal A: " + a.global + "\nGlobal B: " + b.global);
                        }
                        if (a.per_role && b.per_role) {
                            // check if role present in multiple objects have diferent values
                            for (var role in a.per_role) {
                                if (role in b.per_role) {
                                    if (a.per_role[role] !== b.per_role[role]) {
                                        errors.push("Mismatching value for role " + role + " of depth limit of api limits:\n  Role " + role + " A: " + a.per_role[role] + "\n  Role " + role + " B: " + b.per_role[role]);
                                    }
                                }
                            }
                        }
                        return errors.length ? errors : null;
                    },
                    merge: function (limits) { return ({
                        global: limits[0].global,
                        per_role: Object.assign.apply(Object, __spreadArray([{}], limits.map(function (limit) { return limit.per_role; }), false)),
                    }); },
                },
                node_limit: {
                    conflictCheck: function (a, b) {
                        var errors = [];
                        // check if globals mismatch
                        if (a.global !== b.global) {
                            errors.push("Mismatching global value for node limit of api limits\nGlobal A: " + a.global + "\nGlobal B: " + b.global);
                        }
                        if (a.per_role && b.per_role) {
                            // check if role present in multiple objects have diferent values
                            for (var role in a.per_role) {
                                if (role in b.per_role) {
                                    if (a.per_role[role] !== b.per_role[role]) {
                                        errors.push("Mismatching value for role " + role + " of node limit of api limits:\n  Role " + role + " A: " + a.per_role[role] + "\n  Role " + role + " B: " + b.per_role[role]);
                                    }
                                }
                            }
                        }
                        return errors.length ? errors : null;
                    },
                    merge: function (limits) { return ({
                        global: limits[0].global,
                        per_role: Object.assign.apply(Object, __spreadArray([{}], limits.map(function (limit) { return limit.per_role; }), false)),
                    }); },
                },
                rate_limit: {
                    conflictCheck: function (a, b) {
                        var errors = [];
                        function isRateLimitRuleConflict(ruleA, ruleB) {
                            // if these values do not match, error
                            if (ruleA.max_reqs_per_min !== ruleB.max_reqs_per_min)
                                return true;
                            // if a is falsy, and b is not, error
                            if (!ruleA.unique_params && ruleB.unique_params)
                                return true;
                            // if a is IP and b is not, error
                            if (ruleA.unique_params === 'IP' && ruleB.unique_params !== 'IP')
                                return true;
                            // if a is array...
                            if (Array.isArray(ruleA.unique_params)) {
                                // ...and b is not, error
                                if (!Array.isArray(ruleB.unique_params))
                                    return true;
                                // copy, sort, join, and compare the two arrays, if unequal error
                                if (ruleA.unique_params.slice().sort().join(',') !==
                                    ruleB.unique_params.slice().sort().join(','))
                                    return true;
                            }
                            return false;
                        }
                        if (isRateLimitRuleConflict(a.global, b.global)) {
                            errors.push("Mismatching configuration for global rate limit:\nRate Limit A: " + JSON.stringify(a.global) + "\nRate Limit B: " + JSON.stringify(b.global));
                        }
                        if (a.per_role && b.per_role) {
                            for (var role in a.per_role) {
                                if (role in b.per_role) {
                                    if (isRateLimitRuleConflict(a.per_role[role], b.per_role[role])) {
                                        errors.push("Mismatching configuration for global rate limit:\nRate Limit for Role " + role + ": " + JSON.stringify(a.per_role[role]) + "\nRate Limit for Role " + role + ": " + JSON.stringify(b.per_role[role]));
                                    }
                                }
                            }
                        }
                        return errors.length ? errors : null;
                    },
                    merge: function (limits) { return ({
                        global: limits[0].global,
                        per_role: Object.assign.apply(Object, __spreadArray([{}], limits.map(function (limit) { return limit.per_role; }), false)),
                    }); },
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
                return {
                    name: actions[0].name,
                    definition: actions[0].definition,
                    permissions: children.permissions,
                    comment: concatenateComments(actions),
                };
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
            object_children: {
                definition: {
                    conflictCheck: function (a, b) {
                        return JSON.stringify(a) !== JSON.stringify(b)
                            ? "Mismatched action definitions:\n    Action A " + JSON.stringify(a) + "\n    Action B " + JSON.stringify(b)
                            : null;
                    },
                },
            },
        },
        sources: {
            identity: function (s) { return s.name; },
            conflictCheck: function (a, b) {
                return a.kind !== b.kind
                    ? "Mismatched Source kinds\nSource A " + a.kind + "\nSource B " + b.kind
                    : JSON.stringify(a.configuration) !== JSON.stringify(b.configuration)
                        ? "Mismatched Source Configuration:\nConfiguration A: " + JSON.stringify(a.configuration) + "\nConfiguration B: " + JSON.stringify(b.configuration)
                        : null;
            },
            merge: function (_a, children) {
                var _b;
                var s = _a[0];
                return ({
                    name: s.name,
                    kind: s.kind,
                    configuration: s.configuration,
                    tables: children.tables,
                    functions: (_b = children.functions) !== null && _b !== void 0 ? _b : undefined,
                });
            },
            array_children: {
                functions: {
                    identity: function (f) {
                        return typeof f.function === 'string'
                            ? f.function
                            : f.function.schema + "." + f.function.name;
                    },
                    conflictCheck: function (a, b) {
                        return JSON.stringify(a) !== JSON.stringify(b)
                            ? "Mismatched functions:\nFunctions A: " + JSON.stringify(a) + "\nFunctions B: " + JSON.stringify(b)
                            : null;
                    },
                },
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
                        if (JSON.stringify(a.configuration) !==
                            JSON.stringify(b.configuration)) {
                            errors.push("Mismatched table Configurations:\nConfiguration A: " + JSON.stringify(a.configuration) + "\nConfiguration B: " + JSON.stringify(b.configuration));
                        }
                        if (JSON.stringify(a.is_enum) !== JSON.stringify(b.is_enum)) {
                            errors.push("Mismatched table is enum:\nTable A is enum: " + JSON.stringify(a.is_enum) + "\nTable B is enum: " + JSON.stringify(b.is_enum));
                        }
                        return errors.length ? errors : null;
                    },
                    merge: function (_a, children) {
                        var t = _a[0];
                        return ({
                            table: t.table,
                            is_enum: t.is_enum,
                            configuration: t.configuration,
                            computed_fields: children.computed_fields,
                            object_relationships: children.object_relationships,
                            array_relationships: children.array_relationships,
                            remote_relationships: children.remote_relationships,
                            event_triggers: children.event_triggers,
                            insert_permissions: children.insert_permissions,
                            select_permissions: children.select_permissions,
                            update_permissions: children.update_permissions,
                            delete_permissions: children.delete_permissions,
                        });
                    },
                    array_children: {
                        array_relationships: {
                            identity: function (a) { return a.name; },
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.using) !== JSON.stringify(b.using)
                                    ? "Mismatched relationship definitions:\nRelation A " + JSON.stringify(a.using) + "\nRelation B " + JSON.stringify(b.using)
                                    : null;
                            },
                            merge: function (relationships) { return ({
                                name: relationships[0].name,
                                using: relationships[0].using,
                                comment: concatenateComments(relationships),
                            }); },
                        },
                        object_relationships: {
                            identity: function (a) { return a.name; },
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.using) !== JSON.stringify(b.using)
                                    ? "Mismatched relationship definitions:\nRelation A " + JSON.stringify(a.using) + "\nRelation B " + JSON.stringify(b.using)
                                    : null;
                            },
                            merge: function (relationships) { return ({
                                name: relationships[0].name,
                                using: relationships[0].using,
                                comment: concatenateComments(relationships),
                            }); },
                        },
                        select_permissions: {
                            identity: function (p) { return p.role; },
                            // conflict if permissions mismatch whatsoever
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                                    ? "Mismatched select permission definition:\nPermissions A " + JSON.stringify(a.permission) + "\nPermissions B " + JSON.stringify(b.permission)
                                    : null;
                            },
                            // if comments are different, concatenate
                            merge: function (permissions) { return ({
                                permission: permissions[0].permission,
                                role: permissions[0].role,
                                comment: concatenateComments(permissions),
                            }); },
                        },
                        insert_permissions: {
                            identity: function (p) { return p.role; },
                            // conflict if permissions mismatch whatsoever
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                                    ? "Mismatched insert permission definition:\nPermissions A " + JSON.stringify(a.permission) + "\nPermissions B " + JSON.stringify(b.permission)
                                    : null;
                            },
                            // if comments are different, concatenate
                            merge: function (permissions) { return ({
                                permission: permissions[0].permission,
                                role: permissions[0].role,
                                comment: concatenateComments(permissions),
                            }); },
                        },
                        update_permissions: {
                            identity: function (p) { return p.role; },
                            // conflict if permissions mismatch whatsoever
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                                    ? "Mismatched update permission definition:\nPermissions A " + JSON.stringify(a.permission) + "\nPermissions B " + JSON.stringify(b.permission)
                                    : null;
                            },
                            // if comments are different, concatenate
                            merge: function (permissions) { return ({
                                permission: permissions[0].permission,
                                role: permissions[0].role,
                                comment: concatenateComments(permissions),
                            }); },
                        },
                        delete_permissions: {
                            identity: function (p) { return p.role; },
                            // conflict if permissions mismatch whatsoever
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                                    ? "Mismatched delete permission definition:\nPermissions A " + JSON.stringify(a.permission) + "\nPermissions B " + JSON.stringify(b.permission)
                                    : null;
                            },
                            // if comments are different, concatenate
                            merge: function (permissions) { return ({
                                permission: permissions[0].permission,
                                role: permissions[0].role,
                                comment: concatenateComments(permissions),
                            }); },
                        },
                        computed_fields: {
                            identity: function (f) { return f.name; },
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.definition) !== JSON.stringify(b.definition)
                                    ? "Mismatched computed field definition:\nComputed Field A " + JSON.stringify(a.definition) + "\nComputed Field B " + JSON.stringify(b.definition)
                                    : null;
                            },
                            merge: function (fields) { return ({
                                name: fields[0].name,
                                definition: fields[0].definition,
                                comment: concatenateComments(fields),
                            }); },
                        },
                        remote_relationships: {
                            identity: function (r) { return r.name; },
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a.definition) !== JSON.stringify(b.definition)
                                    ? "Mismatched computed field definition:\n    Computed Field A " + JSON.stringify(a.definition) + "\n    Computed Field B " + JSON.stringify(b.definition)
                                    : null;
                            },
                        },
                        event_triggers: {
                            identity: function (t) { return t.name; },
                            conflictCheck: function (a, b) {
                                return JSON.stringify(a) !== JSON.stringify(b)
                                    ? "Mismatched event trigger definition:\nEvent Trigger A " + JSON.stringify(a.definition) + "\nEvent Trigger B " + JSON.stringify(b.definition)
                                    : null;
                            },
                        },
                    },
                },
            },
        },
        allowlist: {
            identity: function (l) { return l.collection; },
        },
        query_collections: {
            identity: function (c) { return c.name; },
            merge: function (collections, children) { return (__assign({ name: collections[0].name, comment: concatenateComments(collections) }, children)); },
            object_children: {
                definition: {
                    merge: function (definitions, chidren) {
                        var _a;
                        return ({
                            queries: (_a = chidren.queries) !== null && _a !== void 0 ? _a : [],
                        });
                    },
                    array_children: {
                        queries: {
                            identity: function (q) { return q.name; },
                            conflictCheck: function (a, b) {
                                return a.query !== b.query
                                    ? "Mismatched Queries:\nQuery A: " + a.query + "\nQuery B: " + b.query
                                    : null;
                            },
                        },
                    },
                },
            },
        },
        inherited_roles: {
            identity: function (r) { return r.role_name; },
            array_children: {
                role_set: {
                    identity: function (r) { return r; },
                },
            },
        },
        cron_triggers: {
            identity: function (t) { return t.name; },
            conflictCheck: function (a, b) {
                return JSON.stringify(a) !== JSON.stringify(b)
                    ? "Mismatched Cron Triggers:\nTrigger A: " + JSON.stringify(a) + "\nTrigger B: " + JSON.stringify(b)
                    : null;
            },
        },
        rest_endpoints: {
            identity: function (e) { return e.name; },
            conflictCheck: function (a, b) {
                return JSON.stringify(a) !== JSON.stringify(b)
                    ? "Mismatched Rest Endpoint Definitions"
                    : null;
            },
        },
        remote_schemas: {
            identity: function (s) { return s.name; },
            conflictCheck: function (a, b) {
                return JSON.stringify(a.definition) !== JSON.stringify(b)
                    ? "Mismatched Remote Schema Definitions:\nDefinition A: " + JSON.stringify(a.definition) + "\nDefinition B: " + JSON.stringify(b.definition)
                    : null;
            },
            merge: function (schemas, children) { return ({
                name: schemas[0].name,
                comment: concatenateComments(schemas),
                definition: schemas[0].definition,
                remote_relationships: schemas[0].remote_relationships,
            }); }
        },
    },
};
