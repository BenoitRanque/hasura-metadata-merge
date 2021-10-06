import fs from 'fs';
import path from 'path';
import { mergeConfig } from './mergeMetadataConfig';
import { readMetadata } from './readMetadata';
import { writeMetadata } from './writeMetadata';
import { MergeObject } from './mergeMetadata';
import { HasuraMetadataV3 } from './HasuraMetadataV3';
import { logMergeErrors, mergeMetadata } from './mergeMetadata';

import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { print } from 'graphql';

export function mergeMetadataDirectories(
  sourceDirectories: string[],
  targetDirectory: string
) {
  console.log('Reading metadata from input directories');

  const sources: MergeObject<HasuraMetadataV3>[] = sourceDirectories.map(
    (origin) => [origin, readMetadata(origin)]
  );

  console.log('Begining merge...');

  const { errors, metadata } = mergeMetadata(sources, mergeConfig);

  if (errors.length) {
    logMergeErrors(errors);
    console.log('Errors encountered, merge aborted. See errors above');
  } else {
    const typeDefs = loadFilesSync(
      sourceDirectories.map((origin) => path.join(origin, 'actions.graphql'))
    );
    console.log(
      'Merging type definitions for actions. Note graphql type validation is not checked.'
    );
    const mergedTypeDefs = mergeTypeDefs(typeDefs, {
      throwOnConflict: true,
      consistentEnumMerge: true,
      useSchemaDefinition: false,
      ignoreFieldConflicts: false,
      forceSchemaDefinition: false,
    });

    console.log(
      'Merge completed successfully, writing metadata to output directory.'
    );
    writeMetadata(targetDirectory, metadata);
    fs.writeFileSync(
      path.join(targetDirectory, 'actions.graphql'),
      print(mergedTypeDefs)
    );
  }
}
