## Hasura Metadata Merge

Utility to merge multiple hasura config v3 metadata directories into one

#### Instalation

The utility can be instaled as an npm module:

```bash
npm install git+https://github.com/BenoitRanque/hasura-metadata-merge.git
```

#### Usage

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

#### Merge Tactic

This package is compatible with any level of additive overlap between configurations being merged.
However, conflicting overlap will result in an error being thrown.

"Conflicting Overlap" being whenever two objects are candidates for merging, but have conflicting properties that cannot be merged.

An example of conflicting overlap is two configurations both defining the `user` role for the same table, but with a different defininitons

#### Caveats

Merging is one-way, once merged there is no way to determine what part of the metada came from which source

This is a limitation of the hasura config v3 metadata spec

#### Status & Coverage

The package is only compatible with hasura config v3 metadata.
New features are not expected, as this package is pretty much single purpose only.

Should a new version of hasura include features that render this package obsolete, it will be deprecated.
Until then we will update this package with each new version of hasura config.

Feedback on how this package is used is welcome, and will be taken into account when designing the replacement feature.

#### Support

Should you run into issues when using this package, you can contact us either by opening a support ticket, via existing

#### Licence

MIT
