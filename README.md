# Hasura Metadata Merge

Utility to merge multiple hasura config v3 metadata directories into one

## Instalation

The utility can be instaled as an npm module:

```bash
npm install git+https://github.com/BenoitRanque/hasura-metadata-merge.git
```

To install a specific version, append the tag to the uri like so:

```bash
npm install git+https://github.com/BenoitRanque/hasura-metadata-merge.git#1.1.6
```

## Usage

The paths to be provided should be paths to metadata directories accesible on the local file system.
The target directory will be completely overwritten if the merge is successful.
If it fails the target directory will not be altered.

The source directories

```js
import { mergeMetadataDirectories } from 'hasura-metadata-merge';

const sourceDirectories = [
  './path/to/source/directory/1/hasura/metadata',
  './path/to/source/directory/2/hasura/metadata',
];

const targetDirectory = './path/to/target/directory/hasura/metadata';

mergeMetadataDirectories(sourceDirectories, targetDirectory);
```

#### Applying arbitrary transformation before writing out the metadata

The `mergeMetadataDirectories` function accepts an optional third parameter `modifyMetadata`
This is a function that will receive the merged metadata, and must return a valid metadata object.
This can be used to make any arbitrary change to the metadata before it is written to the target directory.

Example: removing a specific data source from the merged metadata:

```js
import { mergeMetadataDirectories } from 'hasura-metadata-merge';

const sourceDirectories = [
  './path/to/source/directory/1/hasura/metadata',
  './path/to/source/directory/2/hasura/metadata',
];

const targetDirectory = './path/to/target/directory/hasura/metadata';

mergeMetadataDirectories(sourceDirectories, targetDirectory, (metadata) => {
  // remove the 'dev-only' datasource
  metadata.sources = metadata.sources.filter(
    (source) => source.name !== 'dev-only'
  );

  return metadata;
});
```

#### Additional utilities

An additional two functions are exposed by this package: `readMetadata` and `writeMetadata`

Those are used internally by `mergeMetadataDirectories`, but can also be used on their own.

For example, if you have no use for the merging functionality, but want to apply an arbitrary change to metadata in a directory:

```js
import { readMetadata, writeMetadata } from 'hasura-metadata-merge';

// note: we are using the same path for read and write, so the modified metadaa will overwrite the original
const metadataPath = './path/to/source/directory/hasura/metadata';

const metadata = readMetadata(metadataPath);

// apply an arbitrary change. In this case, add or replace the configuration for apiLimits:
metadata.api_limits = {
  disabled: false,
  depth_limit: {
    global: 20,
    per_role: {
      user: 30,
    },
  },
};

// write out the modified metadata to the source directory
// NOTE WE ARE OVERWRITING THE PREVIOUS VERSION OF THE METADATA. YOU MAY NOT WANT TO DO THIS
writeMetdata(metadataPath, metadata);
```
##### Converting to/from JSON representation

The `readMetadata` and `writeMetadata` can be used to convert between the JSON representation of the metadata used in the server, and the YAML representation used for version control. Below are examples on how to do this:

###### Converting from YAML to JSON
```js
import fs from 'fs'
import { readMetadata } from 'hasura-metadata-merge'

const metadata = readMetadata('path/to/input/hasura/metadata')

fs.writeFileSync('path/to/output.json', JSON.stringify(metadata))
```

###### Converting from JSON to YAML
```js
import fs from 'fs'
import { writeMetadata } from 'hasura-metadata-merge'

const metadata = JSON.parse(fs.readFileSync('path/to/input.json').toString())

writeMetadata('path/to/output/hasura/metadata', metadata)
```

###### Extracting multiple metadata directories from log of metadata changes

This example assumes we have a single input json file which contains an array of objects,
where each object has a `Metadata` key which is a json string representation of metadata.
This is what we get when we extract logs of metadata changes from our systems.

The script will output each log to it's own directory, alongside a `raw.json` file which contains the entire record.
The metadata directory is ready to be applied to a hasura instance using the hasura cli.
Please note that if the user is not using environment variables to configure their database connection string,
they will be censored and need be corrected in `databases/databases.yaml` before being applied.

```js
import fs from 'fs'
import { writeMetadata } from "hasura-metadata-merge";

// raw-metadata-logs.json contains an array where each record has a "Metadata" key which is a json string representation of hasura metadata
// note the casing of "Metadata" is important, if the query yeilded a diferently cased result that case should be used instead.
const metadatas = JSON.parse(fs.readFileSync('./raw-metadata-logs.json').toString())

// Loop over each record in the array
metadatas.forEach((element, index) => {
  // each record will be output in a directory version-<X> where <X> is the index of the record in the original file, starting at 0
  fs.mkdirSync(`./version-${index}/metadata`, { recursive: true })
  fs.writeFileSync(`./version-${index}/raw.json`, JSON.stringify(element))

  const metadata = JSON.parse(element.Metadata)
  writeMetadata(`./version-${index}/metadata`, metadata)
});

```

This script can probably be refined if deemed useful.

## Merge Tactic

This package is compatible with any level of additive overlap between configurations being merged.
However, conflicting overlap will result in an error being thrown.

"Conflicting Overlap" being whenever two objects are candidates for merging, but have conflicting properties that cannot be merged.

An example of conflicting overlap is two configurations both defining the `user` role for the same table, but with a different defininitons

## Caveats

Merging is one-way, once merged there is no way to determine what part of the metada came from which source

This is a limitation of the hasura config v3 metadata spec

## Status & Coverage

The package is only compatible with hasura config v3 metadata.
New features are not expected, as this package is pretty much single purpose only.

Should a new version of hasura include features that render this package obsolete, it will be deprecated.
Until then we will update this package with each new version of hasura config.

Feedback on how this package is used is welcome, and will be taken into account when designing the replacement feature.

## Support

Should you run into issues when using this package, you can open an issue or contact us by opening a support ticket, via the existing methods.

## Changelog

- 1.1.6 - fixed bugs related to how function metadata is output
- 1.1.0 - corrected new types, added `modifyMetadata` argument to `mergeMetadataDirectories`, exposed `readMetadata` and `writeMetadata`
- 1.0.1 - added coverage for entire metadata object, missing types.
- 1.0.0 - initial release, only partial coverate of the metadata object api. No release tag

## Licence

MIT
