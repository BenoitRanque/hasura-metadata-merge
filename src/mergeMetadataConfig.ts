import { MergeConfigRoot } from './mergeMetadata';

export const mergeConfig: MergeConfigRoot = {
  conflictCheck: (a, b) =>
    a.version !== b.version ? 'Mismatched metadata versions' : null,
  merge: ([s], children) => ({
    version: s.version,
    ...children,
  }),
  object_children: {
    custom_types: {
      conflictCheck: (a, b) => null,
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
            JSON.stringify(a) !== JSON.stringify(b)
              ? `Mismatched type definitions
Type A ${JSON.stringify(a)}
Type B ${JSON.stringify(b)}`
              : null,
          merge: ([t]) => t,
        },
        input_objects: {
          identity: (t) => t.name,
          conflictCheck: (a, b) =>
            JSON.stringify(a) !== JSON.stringify(b)
              ? `Mismatched type definitions
Type A ${JSON.stringify(a)}
Type B ${JSON.stringify(b)}`
              : null,
          merge: ([t]) => t,
        },
        objects: {
          identity: (t) => t.name,
          conflictCheck: (a, b) => null,
          merge: ([t], c) => ({ ...t, ...c }),
          array_children: {
            relationships: {
              identity: (r) => r.name,
              conflictCheck: (a, b) =>
                JSON.stringify(a) !== JSON.stringify(b)
                  ? `Mismatched relationship definitions on type
Relation A ${JSON.stringify(a)}
Relation B ${JSON.stringify(b)}`
                  : null,
              merge: ([r]) => r,
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
          ...children,
        };
      },
      array_children: {
        permissions: {
          identity: (p) => p.role,
          conflictCheck: (a, b) => null,
          merge: ([p]) => p,
        },
      },
    },
    sources: {
      identity: (s) => s.name,
      conflictCheck: (a, b) =>
        a.kind !== b.kind
          ? `Mismatched source kinds
Source A ${a.kind}
Source B ${b.kind}`
          : null,
      merge: ([s], children) => ({
        name: s.name,
        kind: s.kind,
        configuration: s.configuration,
        ...children,
      }),
      array_children: {
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

            return errors.length ? errors : null;
          },
          merge: ([t], children) => ({ table: t.table, ...children }),
          array_children: {
            array_relationships: {
              identity: (a) => a.name,
              conflictCheck: (a, b) =>
                JSON.stringify(a.using) !== JSON.stringify(b.using)
                  ? `Mismatched relationship definitions:
Relation A ${JSON.stringify(a.using)}
Relation B ${JSON.stringify(b.using)}`
                  : null,
              merge: ([a], children) => ({
                name: a.name,
                using: a.using,
                ...children,
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
              merge: ([a], children) => ({
                name: a.name,
                using: a.using,
                ...children,
              }),
            },
            select_permissions: {
              identity: (p) => p.role,
              // conflict if permissions mismatch whatsoever
              conflictCheck: (a, b) =>
                JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                  ? `Mismatched permission definition:
Permissions A ${JSON.stringify(a.permission)}
Permissions B ${JSON.stringify(b.permission)}`
                  : null,
              // if comments are different, concatenate
              merge: ([p, ...ps]) => ({
                role: p.role,
                permission: p.permission,
                comment: [p, ...ps]
                  .map(({ comment }) => comment)
                  .filter((comment) => comment)
                  .join(', '),
              }),
            },
            insert_permissions: {
              identity: (p) => p.role,
              // conflict if permissions mismatch whatsoever
              conflictCheck: (a, b) =>
                JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                  ? `Mismatched permission definition:
Permissions A ${JSON.stringify(a.permission)}
Permissions B ${JSON.stringify(b.permission)}`
                  : null,
              // if comments are different, concatenate
              merge: ([p, ...ps]) => ({
                role: p.role,
                permission: p.permission,
                comment: [p, ...ps]
                  .map(({ comment }) => comment)
                  .filter((comment) => comment)
                  .join(', '),
              }),
            },
            update_permissions: {
              identity: (p) => p.role,
              // conflict if permissions mismatch whatsoever
              conflictCheck: (a, b) =>
                JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                  ? `Mismatched permission definition:
Permissions A ${JSON.stringify(a.permission)}
Permissions B ${JSON.stringify(b.permission)}`
                  : null,
              // if comments are different, concatenate
              merge: ([p, ...ps]) => ({
                role: p.role,
                permission: p.permission,
                comment: [p, ...ps]
                  .map(({ comment }) => comment)
                  .filter((comment) => comment)
                  .join(', '),
              }),
            },
            delete_permissions: {
              identity: (p) => p.role,
              // conflict if permissions mismatch whatsoever
              conflictCheck: (a, b) =>
                JSON.stringify(a.permission) !== JSON.stringify(b.permission)
                  ? `Mismatched permission definition:
Permissions A ${JSON.stringify(a.permission)}
Permissions B ${JSON.stringify(b.permission)}`
                  : null,
              // if comments are different, concatenate
              merge: ([p, ...ps]) => ({
                role: p.role,
                permission: p.permission,
                comment: [p, ...ps]
                  .map(({ comment }) => comment)
                  .filter((comment) => comment)
                  .join(', '),
              }),
            },
          },
        },
      },
    },
  },
};
