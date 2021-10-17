export function isValidOperationName(operationName: any): boolean;
export function getTypeFromAstDef(astDef: any): {
    name: any;
    description: any;
    kind: string;
} | {
    error: string;
} | undefined;
export function getTypesFromSdl(sdl: any): {
    types: never[];
    error: null;
};
export function getActionDefinitionFromSdl(sdl: any, ...args: any[]): {
    name: string;
    arguments: never[];
    outputType: string;
    comment: string;
    error: null;
} | {
    name: string;
    arguments: never[];
    outputType: string;
    comment: any;
    error: null;
    type: string;
};
export function getTypesSdl(_types: any): string;
export function getActionDefinitionSdl(name: any, actionType: any, args: any, outputType: any, description: any, ...args: any[]): string;
export function getServerTypesFromSdl(sdl: any, existingTypes: any): {
    types: {
        scalars: never[];
        input_objects: never[];
        objects: never[];
        enums: never[];
    };
    error: null;
};
export function getAllActionsFromSdl(sdl: any): any[];
export function getAllTypesFromSdl(sdl: any): {
    scalars: never[];
    input_objects: never[];
    objects: never[];
    enums: never[];
};
export function getSdlComplete(allActions: any, allTypes: any): string;
