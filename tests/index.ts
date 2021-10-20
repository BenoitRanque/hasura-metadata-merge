import { mergeMetadataDirectories } from '../src/index';

// note: currently test data does not live on the repo, as some of it is delicate information
// TODO: build a test dataset with coverage of as many features as possible

const sourceDirectories = [
  '../metadata/first_metadata/hasura/metadata',
  '../metadata/second_metadata/hasura/metadata',
  '../metadata/third_metadata/hasura/metadata',
];
const targetDirectory = '../test-output';

mergeMetadataDirectories(sourceDirectories, targetDirectory, (metadata) => {
  metadata.api_limits = {
    disabled: false,
    depth_limit: {
      global: 20,
      per_role: {
        user: 30,
      },
    },
  };

  return metadata;
});
