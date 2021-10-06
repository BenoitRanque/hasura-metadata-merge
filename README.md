## Hasura Metadata Merge

Utility to merge multiple hasura config v3 metadata directories into one

#### Merge Tactic

This package is compatible with any level of additive overlap between configurations being merged.
However, conflicting overlap will result in an error being thrown.

"Conflicting Overlap" being whenever two objects are candidates for merging, but have conflicting properties that cannot be merged.

An example of conflicting overlap is two configurations both defining the `user` role for the same table, but with a different defininiton

#### Usage

```js
import { mergeMetadataDirectories } from 'hasura-metadata-merge';

const sourceDirectories = [
  './path/to/source/directory/1',
  './path/to/source/directory/2',
];

const targetDirectory = './path/to/target/directory';

mergeMetadataDirectories(sourceDirectories, targetDirectory);
```

#### Caveats

Merging is one-way, once merged there is no way to determine what part of the metada came from which source
This is a limitation of the hasura config v3 metadata spec

#### Status & Support

The package is only compatible with hasura config v3 metadata.
New features are not expected, as this package is pretty much single purpose only.

Should a new version of hasura include features that render this package obsolete, it will be deprecated.
Until then we will update this package with each new version of hasura config.

Feedback on how this package is used is welcome, and will be taken into account when designing the replacement feature.

#### Licence

MIT
