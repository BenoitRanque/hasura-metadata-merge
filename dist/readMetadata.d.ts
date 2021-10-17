import { HasuraMetadataV3, Action } from './HasuraMetadataV3';
import { CustomTypes } from '@hasura/metadata';
export declare function readActions(inputDir: string): {
    actions: Action[];
    custom_types: CustomTypes;
};
export declare function readMetadata(inputDir: string): HasuraMetadataV3;
