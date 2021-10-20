import { RateLimitRule } from './HasuraMetadataV3';
import { MergeConfigRoot } from './mergeMetadata';

// utility to concatenate unique comment strings.
function concatenateComments<T extends { comment?: string }>(
  items: T[]
): string | undefined {
  const uniqueComments = Array.from(
    new Set(
      items
        .map(({ comment }) => comment)
        .filter((s): s is string => !!s)
        .map((s) => s.trim())
    )
  );
  return uniqueComments.length ? uniqueComments.join(', ') : undefined;
}
// utility to concatenate unique description strings.
function concatenateDescriptions<T extends { description?: string }>(
  items: T[]
): string | undefined {
  const uniqueDescriptions = Array.from(
    new Set(
      items
        .map(({ description }) => description)
        .filter((s): s is string => !!s)
        .map((s) => s.trim())
    )
  );
  return uniqueDescriptions.length ? uniqueDescriptions.join(', ') : undefined;
}

export const mergeConfig: MergeConfigRoot = {
  conflictCheck: (a, b) =>
    a.version !== b.version ? 'Mismatched metadata versions' : null,
  merge: (metadatas, children) => ({
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
    allowlist: children.allowlist ?? [],
    rest_endpoints: children.rest_endpoints ?? [],
    cron_triggers: children.cron_triggers ?? [],
    query_collections: children.query_collections ?? [],
    remote_schemas: children.remote_schemas ?? [],
  }),
  object_children: {
    custom_types: {
      merge: (cts, children) => ({
        enums: children.enums ?? [],
        input_objects: children.input_objects ?? [],
        objects: children.objects ?? [],
        scalars: children.scalars ?? [],
      }),
      array_children: {
        enums: {
          identity: (t) => t.name,
          conflictCheck: (a, b) =>
            JSON.stringify(a.values) !== JSON.stringify(b.values)
              ? `Mismatched type definitions
Type A ${JSON.stringify(a)}
Type B ${JSON.stringify(b)}`
              : null,
          merge: (enums) => ({
            name: enums[0].name,
            values: enums[0].values,
            description: concatenateDescriptions(enums),
          }),
        },
        input_objects: {
          identity: (t) => t.name,
          conflictCheck: (a, b) =>
            JSON.stringify(a.fields) !== JSON.stringify(b.fields)
              ? `Mismatched type definitions
Type A ${JSON.stringify(a)}
Type B ${JSON.stringify(b)}`
              : null,
          merge: (objects) => ({
            name: objects[0].name,
            fields: objects[0].fields,
            description: concatenateDescriptions(objects),
          }),
        },
        objects: {
          identity: (t) => t.name,
          conflictCheck: (a, b) =>
            a.fields
              .map((f) => f.name)
              .sort()
              .join(',') !==
            b.fields
              .map((f) => f.name)
              .sort()
              .join(',')
              ? `Mismatched object type fields:
Object A fields: ${a.fields.map((f) => f.name).join(', ')}
Object B fields: ${b.fields.map((f) => f.name).join(', ')}`
              : null,

          merge: (objects, children) => ({
            name: objects[0].name,
            fields: objects[0].fields,
            description: concatenateDescriptions(objects),
            relationships: children.relationships,
          }),
          array_children: {
            relationships: {
              identity: (r) => r.name,
              conflictCheck: (a, b) =>
                JSON.stringify(a) !== JSON.stringify(b)
                  ? `Mismatched relationship definitions on type
Relation A ${JSON.stringify(a)}
Relation B ${JSON.stringify(b)}`
                  : null,
            },
            fields: {
              identity: (f) => f.name,
              conflictCheck: (a, b) =>
                a.type !== b.type
                  ? `Mismatched Types on field ${a.name}:
Type A: ${a.type}
Type B: ${b.type}`
                  : null,
            },
          },
        },
        scalars: {
          identity: (t) => t.name,
          conflictCheck: (a, b) =>
            JSON.stringify(a) !== JSON.stringify(b)
              ? `Mismatched type definitions
Type A ${JSON.stringify(a)}
Type B ${JSON.stringify(b)}`
              : null,
          merge: ([t]) => t,
        },
      },
    },
    api_limits: {
      conflictCheck: (a, b) =>
        a.disabled !== b.disabled
          ? `Mismatching "disabled" value for api limit"`
          : null,
      object_children: {
        depth_limit: {
          conflictCheck: (a, b) => {
            const errors: string[] = [];
            // check if globals mismatch
            if (a.global !== b.global) {
              errors.push(`Mismatching global value for depth limit of api limits:
Global A: ${a.global}
Global B: ${b.global}`);
            }
            if (a.per_role && b.per_role) {
              // check if role present in multiple objects have diferent values
              for (const role in a.per_role) {
                if (role in b.per_role) {
                  if (a.per_role[role] !== b.per_role[role]) {
                    errors.push(`Mismatching value for role ${role} of depth limit of api limits:
  Role ${role} A: ${a.per_role[role]}
  Role ${role} B: ${b.per_role[role]}`);
                  }
                }
              }
            }
            return errors.length ? errors : null;
          },
          merge: (limits) => ({
            global: limits[0].global,
            per_role: Object.assign(
              {},
              ...limits.map((limit) => limit.per_role)
            ),
          }),
        },
        node_limit: {
          conflictCheck: (a, b) => {
            const errors: string[] = [];
            // check if globals mismatch
            if (a.global !== b.global) {
              errors.push(`Mismatching global value for node limit of api limits
Global A: ${a.global}
Global B: ${b.global}`);
            }
            if (a.per_role && b.per_role) {
              // check if role present in multiple objects have diferent values
              for (const role in a.per_role) {
                if (role in b.per_role) {
                  if (a.per_role[role] !== b.per_role[role]) {
                    errors.push(`Mismatching value for role ${role} of node limit of api limits:
  Role ${role} A: ${a.per_role[role]}
  Role ${role} B: ${b.per_role[role]}`);
                  }
                }
              }
            }
            return errors.length ? errors : null;
          },
          merge: (limits) => ({
            global: limits[0].global,
            per_role: Object.assign(
              {},
              ...limits.map((limit) => limit.per_role)
            ),
          }),
        },
        rate_limit: {
          conflictCheck: (a, b) => {
            const errors: string[] = [];

            function isRateLimitRuleConflict(
              ruleA: RateLimitRule,
              ruleB: RateLimitRule
            ): boolean {
              // if these values do not match, error
              if (ruleA.max_reqs_per_min !== ruleB.max_reqs_per_min)
                return true;

              // if a is falsy, and b is not, error
              if (!ruleA.unique_params && ruleB.unique_params) return true;

              // if a is IP and b is not, error
              if (ruleA.unique_params === 'IP' && ruleB.unique_params !== 'IP')
                return true;

              // if a is array...
              if (Array.isArray(ruleA.unique_params)) {
                // ...and b is not, error
                if (!Array.isArray(ruleB.unique_params)) return true;

                // copy, sort, join, and compare the two arrays, if unequal error
                if (
                  ruleA.unique_params.slice().sort().join(',') !==
                  ruleB.unique_params.slice().sort().join(',')
                )
                  return true;
              }

              return false;
            }

            if (isRateLimitRuleConflict(a.global, b.global)) {
              errors.push(`Mismatching configuration for global rate limit:
Rate Limit A: ${JSON.stringify(a.global)}
Rate Limit B: ${JSON.stringify(b.global)}`);
            }

            if (a.per_role && b.per_role) {
              for (const role in a.per_role) {
                if (role in b.per_role) {
                  if (
                    isRateLimitRuleConflict(a.per_role[role], b.per_role[role])
                  ) {
                    errors.push(`Mismatching configuration for global rate limit:
Rate Limit for Role ${role}: ${JSON.stringify(a.per_role[role])}
Rate Limit for Role ${role}: ${JSON.stringify(b.per_role[role])}`);
                  }
                }
              }
            }

            return errors.length ? errors : null;
          },
          merge: (limits) => ({
            global: limits[0].global,
            per_role: Object.assign(
              {},
              ...limits.map((limit) => limit.per_role)
            ),
          }),
        },
      },
    },
  },
  array_children: {
    actions: {
      identity: (a) => a.name,
      conflictCheck: (a, b) =>
        JSON.stringify(a.definition) !== JSON.stringify(b.definition)
          ? `Mismatched action definitions:
    Action A ${JSON.stringify(a.definition)}
    Action B ${JSON.stringify(b.definition)}`
          : null,
      merge: (actions, children) => {
        return {
          name: actions[0].name,
          definition: actions[0].definition,
          permissions: children.permissions,
          comment: concatenateComments(actions),
        };
      },
      array_children: {
        permissions: {
          identity: (p) => p.role,
          conflictCheck: (a, b) => null,
          merge: ([p]) => p,
        },
      },
      object_children: {
        definition: {
          conflictCheck: (a, b) =>
            JSON.stringify(a) !== JSON.stringify(b)
              ? `Mismatched action definitions:
    Action A ${JSON.stringify(a)}
    Action B ${JSON.stringify(b)}`
              : null,
        },
      },
    },
    sources: {
      identity: (s) => s.name,
      conflictCheck: (a, b) =>
        a.kind !== b.kind
          ? `Mismatched Source kinds
Source A ${a.kind}
Source B ${b.kind}`
          : JSON.stringify(a.configuration) !== JSON.stringify(b.configuration)
          ? `Mismatched Source Configuration:
Configuration A: ${JSON.stringify(a.configuration)}
Configuration B: ${JSON.stringify(b.configuration)}`
          : null,
      merge: ([s], children) => ({
        name: s.name,
        kind: s.kind,
        configuration: s.configuration,
        tables: children.tables,
        functions: children.functions ?? undefined,
      }),
      array_children: {
        functions: {
          identity: (f) =>
            typeof f.function === 'string'
              ? f.function
              : `${f.function.schema}.${f.function.name}`,
          conflictCheck: (a, b) =>
            JSON.stringify(a) !== JSON.stringify(b)
              ? `Mismatched functions:
Functions A: ${JSON.stringify(a)}
Functions B: ${JSON.stringify(b)}`
              : null,
        },
        tables: {
          identity: (t) => `${t.table.schema}.${t.table.name}`,
          conflictCheck: (a, b) => {
            const errors: string[] = [];
            // check for relationships with same name defined as array relationships on one table, and object relationship on the other, or vice versa
            if (a.array_relationships && b.object_relationships) {
              for (const aRelation of a.array_relationships) {
                for (const bRelation of b.object_relationships) {
                  if (aRelation.name === bRelation.name) {
                    errors.push(
                      `Relation ${aRelation.name} defined as array relation on table A but object relation on table B`
                    );
                  }
                }
              }
            }
            if (a.object_relationships && b.array_relationships) {
              for (const aRelation of a.object_relationships) {
                for (const bRelation of b.array_relationships) {
                  if (aRelation.name === bRelation.name) {
                    errors.push(
                      `Relation ${aRelation.name} defined as object relation on table A but array relation on table B`
                    );
                  }
                }
              }
            }

            if (
              JSON.stringify(a.configuration) !==
              JSON.stringify(b.configuration)
            ) {
              errors.push(`Mismatched table Configurations:
Configuration A: ${JSON.stringify(a.configuration)}
Configuration B: ${JSON.stringify(b.configuration)}`);
            }

            if (JSON.stringify(a.is_enum) !== JSON.stringify(b.is_enum)) {
              errors.push(`Mismatched table is enum:
Table A is enum: ${JSON.stringify(a.is_enum)}
Table B is enum: ${JSON.stringify(b.is_enum)}`);
            }

            return errors.length ? errors : null;
          },
          merge: ([t], children) => ({
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
          }),
          array_children: {
            array_relationships: {
              identity: (a) => a.name,
              conflictCheck: (a, b) =>
                JSON.stringify(a.using) !== JSON.stringify(b.using)
                  ? `Mismatched relationship definitions:
Relation A ${JSON.stringify(a.using)}
Relation B ${JSON.stringify(b.using)}`
                  : null,
              merge: (relationships) => ({
                name: relationships[0].name,
                using: relationships[0].using,
                comment: concatenateComments(relationships),
              }),
            },
            object_relationships: {
              identity: (a) => a.name,
              conflictCheck: (a, b) =>
                JSON.stringify(a.using) !== JSON.stringify(b.using)
                  ? `Mismatched relationship definitions:
Relation A ${JSON.stringify(a.using)}
Relation B ${JSON.stringify(b.using)}`
                  : null,
              merge: (relationships) => ({
                name: relationships[0].name,
                using: relationships[0].using,
                comment: concatenateComments(relationships),
              }),
            },
            select_permissions: {
              identity: (p) => p.role,
              // conflict if permissions mismatch whatsoever
              conflictCheck: (a, b) =>
                JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                  ? `Mismatched select permission definition:
Permissions A ${JSON.stringify(a.permission)}
Permissions B ${JSON.stringify(b.permission)}`
                  : null,
              // if comments are different, concatenate
              merge: (permissions) => ({
                permission: permissions[0].permission,
                role: permissions[0].role,
                comment: concatenateComments(permissions),
              }),
            },
            insert_permissions: {
              identity: (p) => p.role,
              // conflict if permissions mismatch whatsoever
              conflictCheck: (a, b) =>
                JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                  ? `Mismatched insert permission definition:
Permissions A ${JSON.stringify(a.permission)}
Permissions B ${JSON.stringify(b.permission)}`
                  : null,
              // if comments are different, concatenate
              merge: (permissions) => ({
                permission: permissions[0].permission,
                role: permissions[0].role,
                comment: concatenateComments(permissions),
              }),
            },
            update_permissions: {
              identity: (p) => p.role,
              // conflict if permissions mismatch whatsoever
              conflictCheck: (a, b) =>
                JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                  ? `Mismatched update permission definition:
Permissions A ${JSON.stringify(a.permission)}
Permissions B ${JSON.stringify(b.permission)}`
                  : null,
              // if comments are different, concatenate
              merge: (permissions) => ({
                permission: permissions[0].permission,
                role: permissions[0].role,
                comment: concatenateComments(permissions),
              }),
            },
            delete_permissions: {
              identity: (p) => p.role,
              // conflict if permissions mismatch whatsoever
              conflictCheck: (a, b) =>
                JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                  ? `Mismatched delete permission definition:
Permissions A ${JSON.stringify(a.permission)}
Permissions B ${JSON.stringify(b.permission)}`
                  : null,
              // if comments are different, concatenate
              merge: (permissions) => ({
                permission: permissions[0].permission,
                role: permissions[0].role,
                comment: concatenateComments(permissions),
              }),
            },
            computed_fields: {
              identity: (f) => f.name,
              conflictCheck: (a, b) =>
                JSON.stringify(a.definition) !== JSON.stringify(b.definition)
                  ? `Mismatched computed field definition:
Computed Field A ${JSON.stringify(a.definition)}
Computed Field B ${JSON.stringify(b.definition)}`
                  : null,
              merge: (fields) => ({
                name: fields[0].name,
                definition: fields[0].definition,
                comment: concatenateComments(fields),
              }),
            },
            remote_relationships: {
              identity: (r) => r.name,
              conflictCheck: (a, b) =>
                JSON.stringify(a.definition) !== JSON.stringify(b.definition)
                  ? `Mismatched computed field definition:
    Computed Field A ${JSON.stringify(a.definition)}
    Computed Field B ${JSON.stringify(b.definition)}`
                  : null,
            },
            event_triggers: {
              identity: (t) => t.name,
              conflictCheck: (a, b) =>
                JSON.stringify(a) !== JSON.stringify(b)
                  ? `Mismatched event trigger definition:
Event Trigger A ${JSON.stringify(a.definition)}
Event Trigger B ${JSON.stringify(b.definition)}`
                  : null,
            },
          },
        },
      },
    },
    allowlist: {
      identity: (l) => l.collection,
    },
    query_collections: {
      identity: (c) => c.name,
      merge: (collections, children) => ({
        name: collections[0].name,
        comment: concatenateComments(collections),
        ...children,
      }),
      object_children: {
        definition: {
          merge: (definitions, chidren) => ({
            queries: chidren.queries ?? [],
          }),
          array_children: {
            queries: {
              identity: (q) => q.name,
              conflictCheck: (a, b) =>
                a.query !== b.query
                  ? `Mismatched Queries:
Query A: ${a.query}
Query B: ${b.query}`
                  : null,
            },
          },
        },
      },
    },
    inherited_roles: {
      identity: (r) => r.role_name,
      array_children: {
        role_set: {
          identity: (r) => r,
        },
      },
    },
    cron_triggers: {
      identity: (t) => t.name,
      conflictCheck: (a, b) =>
        JSON.stringify(a) !== JSON.stringify(b)
          ? `Mismatched Cron Triggers:
Trigger A: ${JSON.stringify(a)}
Trigger B: ${JSON.stringify(b)}`
          : null,
    },
    rest_endpoints: {
      identity: (e) => e.name,
      conflictCheck: (a, b) =>
        JSON.stringify(a) !== JSON.stringify(b)
          ? `Mismatched Rest Endpoint Definitions`
          : null,
    },
    remote_schemas: {
      identity: (s) => s.name,
      conflictCheck: (a, b) =>
        JSON.stringify(a.definition) !== JSON.stringify(b)
          ? `Mismatched Remote Schema Definitions:
Definition A: ${JSON.stringify(a.definition)}
Definition B: ${JSON.stringify(b.definition)}`
          : null,
      merge: (schemas, children) => ({
        name: schemas[0].name,
        comment: concatenateComments(schemas),
        definition: schemas[0].definition,
      }),
    },
  },
};
