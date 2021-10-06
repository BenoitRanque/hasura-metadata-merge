import { HasuraMetadataV3 } from './HasuraMetadataV3';

export type MergeConfigRoot = Pick<
  MergeConfigObject<HasuraMetadataV3>,
  'array_children' | 'object_children' | 'conflictCheck' | 'merge'
>;
export type MergeObject<T> = [origin: string, source: T];

type StringKey<T> = T extends string ? T : never;
type ObjectProperties<T> = Exclude<
  {
    [P in keyof T]-?: T[P] extends undefined | object ? StringKey<P> : never;
  }[keyof T],
  ArrayProperties<T>
>;
type ArrayProperties<T> = {
  [P in keyof T]-?: T[P] extends undefined | unknown[] ? StringKey<P> : never;
}[keyof T];
type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
type MergeConfigObject<T> = {
  identity: (source: T) => string;
  conflictCheck: (sourceA: T, sourceB: T) => string | string[] | null;
  merge: (objs: [T, ...T[]], children: Pick<T, ArrayProperties<T>>) => T;
  object_children?: MergeConfigObjectChildren<T>;
  array_children?: MergeConfigArrayChildren<T>;
};
type MergeConfigObjectChildren<T> = {
  [K in ObjectProperties<T>]?: Omit<
    MergeConfigObject<NonNullable<T[K]>>,
    'identity'
  >;
};
type MergeConfigArrayChildren<T> = {
  [K in ArrayProperties<T>]?: MergeConfigObject<ArrayElement<T[K]>>;
};
type MergeError = {
  message: string;
  originA: string;
  originB: string;
  location: string[];
};

function mergeMetadataObjects<T>(
  sources: MergeObject<T>[],
  config: Pick<
    MergeConfigObject<T>,
    'array_children' | 'object_children' | 'merge' | 'conflictCheck'
  >,
  location: string[],
  errors: MergeError[]
): T {
  // check for conflicts against every other object of the same type
  sources.forEach(([originA, sourceA], index) => {
    if (sources.length > index + 1) {
      sources.slice(index + 1).forEach(([originB, sourceB]) => {
        const conflictMessages = config.conflictCheck(sourceA, sourceB);

        if (conflictMessages) {
          if (Array.isArray(conflictMessages)) {
            conflictMessages.forEach((message) => {
              errors.push({
                location,
                originA,
                originB,
                message,
              });
            });
          } else {
            errors.push({
              location,
              originA,
              originB,
              message: conflictMessages,
            });
          }
        }
      });
    }
  });

  const array_children = !config.array_children
    ? {}
    : Object.fromEntries(
        Object.keys(config.array_children).map((key) => {
          const childKey = key as ArrayProperties<T>;
          const childConfig = config.array_children![childKey]!;

          const mergedArrays = mergeMetadataArrays(
            sources,
            childKey,
            childConfig,
            location,
            errors
          );

          return [key, mergedArrays.length ? mergedArrays : undefined];
        })
      );

  const object_children = !config.object_children
    ? {}
    : Object.fromEntries(
        Object.keys(config.object_children).map((key) => {
          const childKey = key as ObjectProperties<T>;
          const childConfig = config.object_children![childKey]!;

          const childSources = sources.reduce<
            MergeObject<T[ObjectProperties<T>]>[]
          >((acc, [origin, parentSource]) => {
            if (parentSource[childKey]) {
              acc.push([origin, parentSource[childKey]]);
            }
            return acc;
          }, []);

          return [
            key,
            childSources.length
              ? mergeMetadataObjects(
                  childSources,
                  childConfig,
                  [...location, childKey],
                  errors
                )
              : undefined,
          ];
        })
      );

  return config.merge(
    [sources[0][1], ...sources.slice(1).map(([origin, source]) => source)],
    {
      ...array_children,
      ...object_children,
    } as Pick<T, ArrayProperties<T> | ObjectProperties<T>>
  );
}

function mergeMetadataArrays<
  T,
  K extends ArrayProperties<T>,
  C extends ArrayElement<T[K]>
>(
  sources: MergeObject<T>[],
  key: K,
  config: MergeConfigObject<C>,
  location: string[],
  errors: MergeError[]
): C[] {
  const dictionary: { [id: string]: MergeObject<C>[] } = {};

  sources.forEach(([origin, source]) => {
    let childCollection = source[key] as C[];
    if (childCollection) {
      childCollection.forEach((child) => {
        const id = config.identity(child);

        if (!dictionary[id]) {
          dictionary[id] = [];
        }
        dictionary[id].push([origin, child]);
      });
    }
  });

  return Object.entries(dictionary).map(([id, childSources]) =>
    mergeMetadataObjects(childSources, config, [...location, key, id], errors)
  );
}

export function mergeMetadata(
  sources: MergeObject<HasuraMetadataV3>[],
  config: MergeConfigRoot
): { metadata: HasuraMetadataV3; errors: MergeError[] } {
  // errors will be modified by reference
  const errors: MergeError[] = [];

  const metadata = mergeMetadataObjects(sources, config, [], errors);

  return { metadata, errors };
}

export function logMergeErrors(errors: MergeError[]) {
  console.warn(
    'The following errors where encountered while attempting to merge metadata:'
  );
  errors.forEach((error) => {
    console.error(`location: ${error.location.join('.')}
${error.message}
origin A ${error.originA}
origin B ${error.originB}
`);
  });
}
