export namespace inbuiltTypes {
    const Int: boolean;
    const Boolean: boolean;
    const String: boolean;
    const Float: boolean;
    const ID: boolean;
}
export function filterNameLessTypeLess(arr: any): any;
export function filterNameless(arr: any): any;
export function filterValueLess(arr: any): any;
export function mergeCustomTypes(newTypesList: any, existingTypesList: any): {
    types: any[];
    overlappingTypenames: any[];
};
export function reformCustomTypes(typesFromState: any): {
    scalars: never[];
    input_objects: never[];
    objects: never[];
    enums: never[];
};
export function parseCustomTypes(customTypesServer: any): any[];
export function getActionTypes(actionDef: any, allTypes: any): any[];
export function hydrateTypeRelationships(newTypes: any, existingTypes: any): any;
