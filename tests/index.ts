import { mergeMetadataDirectories } from '../src/index';

const sourceDirectories = [
  '../metadata/first_metadata/hasura/metadata',
  '../metadata/second_metadata/hasura/metadata',
  '../metadata/third_metadata/hasura/metadata',
];
const targetDirectory = '../test-output';

mergeMetadataDirectories(sourceDirectories, targetDirectory);
