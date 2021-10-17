import { HasuraMetadataV3, Action } from './HasuraMetadataV3';
import { CustomTypes } from '@hasura/metadata';
export declare function writeActions(outputDir: string, { actions, custom_types, }: {
    actions: Action[] | undefined;
    custom_types: CustomTypes | undefined;
}): void;
export declare function writeMetadata(outputDir: string, metadata: HasuraMetadataV3): void;
