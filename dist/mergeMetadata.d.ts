import { HasuraMetadataV3 } from './HasuraMetadataV3';
export declare type MergeConfigRoot = Pick<MergeConfigObject<HasuraMetadataV3>, 'array_children' | 'object_children' | 'conflictCheck' | 'merge'>;
export declare type MergeObject<T> = [origin: string, source: T];
declare type StringKey<T> = T extends string ? T : never;
declare type ObjectProperties<T> = Exclude<{
    [P in keyof T]-?: T[P] extends undefined | object ? StringKey<P> : never;
}[keyof T], ArrayProperties<T>>;
declare type ArrayProperties<T> = {
    [P in keyof T]-?: T[P] extends undefined | unknown[] ? StringKey<P> : never;
}[keyof T];
declare type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
declare type MergeConfigObject<T> = {
    identity: (source: T) => string;
    conflictCheck?: (sourceA: T, sourceB: T) => string | string[] | null;
    merge?: (objs: [T, ...T[]], children: Pick<T, ArrayProperties<T> | ObjectProperties<T>>) => T;
    object_children?: ObjectProperties<T> extends never ? never : MergeConfigObjectChildren<T>;
    array_children?: ArrayProperties<T> extends never ? never : MergeConfigArrayChildren<T>;
};
declare type MergeConfigObjectChildren<T> = {
    [K in ObjectProperties<T>]-?: Omit<MergeConfigObject<NonNullable<T[K]>>, 'identity'>;
};
declare type MergeConfigArrayChildren<T> = {
    [K in ArrayProperties<T>]-?: MergeConfigObject<ArrayElement<T[K]>>;
};
declare type MergeError = {
    message: string;
    originA: string;
    originB: string;
    location: string[];
};
export declare function mergeMetadata(sources: MergeObject<HasuraMetadataV3>[], config: MergeConfigRoot): {
    metadata: HasuraMetadataV3;
    errors: MergeError[];
};
export declare function logMergeErrors(errors: MergeError[]): void;
export {};
