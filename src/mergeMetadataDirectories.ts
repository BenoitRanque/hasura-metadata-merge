import { mergeConfig } from './mergeMetadataConfig';
import { readMetadata } from './readMetadata';
import { writeMetadata } from './writeMetadata';
import { MergeObject } from './mergeMetadata';
import { HasuraMetadataV3 } from './HasuraMetadataV3';
import { logMergeErrors, mergeMetadata } from './mergeMetadata';

export function mergeMetadataDirectories(
  sourceDirectories: string[],
  targetDirectory: string,
  modifyMetadata?: (metadata: HasuraMetadataV3) => HasuraMetadataV3
) {
  console.log('Reading metadata from input directories');

  // map each source directory to an array where each item takes the form [stringOrigin, metadata]
  const sources: MergeObject<HasuraMetadataV3>[] = sourceDirectories.map(
    (origin) => [origin, readMetadata(origin)]
  );

  console.log('Begining merge...');
  // merge all the metadata
  const { errors, metadata } = mergeMetadata(sources, mergeConfig);

  if (errors.length) {
    // this utility prints out any errors to console
    console.warn(
      'Encountered the following errors while attempting to merge metadata:'
    );
    logMergeErrors(errors);
    throw new Error('Errors encountered, merge aborted. See errors above');
  }

  console.log('Merge completed successfully.');

  // optionally apply the modifyMetadata function
  let outputMetadata = modifyMetadata ? modifyMetadata(metadata) : metadata;

  console.log('Writing metadata to output directory');
  writeMetadata(targetDirectory, outputMetadata);
  console.log('Finished, exiting script');
}
