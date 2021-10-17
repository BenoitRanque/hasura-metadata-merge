import { mergeConfig } from './mergeMetadataConfig';
import { readMetadata } from './readMetadata';
import { writeMetadata } from './writeMetadata';
import { MergeObject } from './mergeMetadata';
import { HasuraMetadataV3 } from './HasuraMetadataV3';
import { logMergeErrors, mergeMetadata } from './mergeMetadata';

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
    console.log(
      'Merge completed successfully, writing metadata to output directory.'
    );
    writeMetadata(targetDirectory, metadata);
  }
}
