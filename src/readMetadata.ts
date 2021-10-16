import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { HasuraMetadataV3, Source, Action } from './HasuraMetadataV3';
import {
  getAllActionsFromSdl,
  getAllTypesFromSdl,
} from './shared/utils/sdlUtils';
import { reformCustomTypes } from './shared/utils/hasuraCustomTypeUtils';
import {
  AllowList,
  CronTrigger,
  CustomTypes,
  QueryCollectionEntry,
  RemoteSchema,
  TableEntry,
} from '@hasura/metadata';

function readFile(inputPath: string[], yamlLoad = true): unknown {
  try {
    const file = fs.readFileSync(path.join(...inputPath)).toString();

    return yamlLoad ? yaml.load(file) : file;
  } catch (error) {
    throw error;
  }
}

function readSources(inputDir: string): Source[] {
  const sources = readFile([
    inputDir,
    'databases',
    'databases.yaml',
  ]) as Source[];

  return sources.map((source) => {
    const tableList = readFile([
      inputDir,
      'databases',
      source.name,
      'tables',
      'tables.yaml',
    ]) as string[];

    const tables: TableEntry[] = tableList.map((tablePath) => {
      const table = readFile([
        inputDir,
        'databases',
        source.name,
        'tables',
        tablePath.replace('!include ', ''),
      ]) as TableEntry;

      return table;
    });

    // todo: read functions
    return {
      ...source,
      tables,
    };
  });
}

function mergeByName<T extends { name: string }>(
  sdlArr: T[] | undefined = [],
  ymlArr: T[] | undefined = [],
  handleSDLDuplicateError: (duplicate: T) => void,
  handleYMLDuplicateError: (duplicate: T) => void,
  handleMissingFromSDLError: (duplicate: T) => void,
  handleMissingFromYMLError: (duplicate: T) => void,
  merge: (sdl: T, yml: T) => T = (sdl, yml) => ({ ...sdl, ...yml })
): T[] {
  // if both sources empty, return empty array
  if (sdlArr.length === 0 && ymlArr.length === 0) {
    return [];
  }
  // dictionary to store elements to merge
  const dictionary: { [name: string]: { sdl?: T; yml?: T } } = {};

  // map sdl items to dictionary and check for duplicates
  for (const sdlItem of sdlArr) {
    if (!dictionary[sdlItem.name]) {
      dictionary[sdlItem.name] = {};
    }

    if (dictionary[sdlItem.name].sdl) {
      // item already in dictionary, handle duplicate error
      handleSDLDuplicateError(sdlItem);
    } else {
      dictionary[sdlItem.name].sdl = sdlItem;
    }
  }

  // map yml items to dictionary and check for duplicates
  for (const ymlItem of ymlArr) {
    if (!dictionary[ymlItem.name]) {
      dictionary[ymlItem.name] = {};
    }

    if (dictionary[ymlItem.name].yml) {
      // item already in dictionary, handle duplicate error
      handleYMLDuplicateError(ymlItem);
    } else {
      dictionary[ymlItem.name].yml = ymlItem;
    }
  }

  for (const item of Object.values(dictionary)) {
    // check if item missing from either side
    if (item.yml && !item.sdl) handleMissingFromSDLError(item.yml);
    if (!item.yml && item.sdl) handleMissingFromYMLError(item.sdl);
  }

  // once validated, coherce the type to make fields as required.
  const validatedDictionary = dictionary as {
    [name: string]: { sdl: T; yml: T };
  };

  return Object.values(validatedDictionary).map(({ sdl, yml }) =>
    merge(sdl, yml)
  );
}

export function readActions(inputDir: string): {
  actions: Action[];
  custom_types: CustomTypes;
} {
  const errors: string[] = [];
  const sdl = readFile([inputDir, 'actions.graphql'], false) as string;

  if (!sdl.trim().length) {
    return {
      actions: [],
      custom_types: reformCustomTypes([]),
    };
  }

  const customTypesFromSDL = getAllTypesFromSdl(sdl) as CustomTypes;
  const actionsFromSDL = getAllActionsFromSdl(sdl) as Action[];

  const { actions: actionsFromYAML, custom_types: customTypesFromYAML } =
    readFile([inputDir, 'actions.yaml']) as {
      actions: Action[];
      custom_types: CustomTypes;
    };

  const actions = mergeByName(
    actionsFromSDL,
    actionsFromYAML,
    (duplicate) =>
      errors.push(
        `Duplicate action ${duplicate.name} in actions.graphql in ${inputDir}`
      ),
    (duplicate) =>
      errors.push(
        `Duplicate action ${duplicate.name} in actions.yaml in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing action ${missing.name} in actions.graphql (defined in actions.yaml) in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing action ${missing.name} in actions.yaml (defined in actions.graphql) in ${inputDir}`
      ),
    (sdl, yml) => ({
      ...sdl,
      ...yml,
      definition: {
        ...sdl.definition,
        ...yml.definition,
      },
    })
  );
  const enums = mergeByName(
    customTypesFromSDL.enums,
    customTypesFromYAML.enums,
    (duplicate) =>
      errors.push(
        `Duplicate enum ${duplicate.name} in actions.graphql in ${inputDir}`
      ),
    (duplicate) =>
      errors.push(
        `Duplicate enum ${duplicate.name} in actions.yaml in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing enum ${missing.name} in actions.graphql (defined in actions.yaml) in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing enum ${missing.name} in actions.yaml (defined in actions.graphql) in ${inputDir}`
      )
  );
  const input_objects = mergeByName(
    customTypesFromSDL.input_objects,
    customTypesFromYAML.input_objects,
    (duplicate) =>
      errors.push(
        `Duplicate input_object ${duplicate.name} in actions.graphql in ${inputDir}`
      ),
    (duplicate) =>
      errors.push(
        `Duplicate input_object ${duplicate.name} in actions.yaml in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing input_object ${missing.name} in actions.graphql (defined in actions.yaml) in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing input_object ${missing.name} in actions.yaml (defined in actions.graphql) in ${inputDir}`
      )
  );
  const objects = mergeByName(
    customTypesFromSDL.objects,
    customTypesFromYAML.objects,
    (duplicate) =>
      errors.push(
        `Duplicate object ${duplicate.name} in actions.graphql in ${inputDir}`
      ),
    (duplicate) =>
      errors.push(
        `Duplicate object ${duplicate.name} in actions.yaml in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing object ${missing.name} in actions.graphql (defined in actions.yaml) in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing object ${missing.name} in actions.yaml (defined in actions.graphql) in ${inputDir}`
      )
  );
  const scalars = mergeByName(
    customTypesFromSDL.scalars,
    customTypesFromYAML.scalars,
    (duplicate) =>
      errors.push(
        `Duplicate object ${duplicate.name} in actions.graphql in ${inputDir}`
      ),
    (duplicate) =>
      errors.push(
        `Duplicate object ${duplicate.name} in actions.yaml in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing object ${missing.name} in actions.graphql (defined in actions.yaml) in ${inputDir}`
      ),
    (missing) =>
      errors.push(
        `Missing object ${missing.name} in actions.yaml (defined in actions.graphql) in ${inputDir}`
      )
  );

  if (errors.length) {
    errors.forEach(console.log);
    throw new Error(
      `Errors encountered reading actions metadata in ${inputDir}. See log output above`
    );
  }

  return {
    actions,
    custom_types: {
      enums,
      input_objects,
      objects,
      scalars,
    },
  };
}

export function readMetadata(inputDir: string): HasuraMetadataV3 {
  const version = readFile([inputDir, 'version.yaml']) as {
    version: number;
  };

  if (!version || version.version !== 3) {
    throw new Error(
      `Incompatible metadata version in directory ${inputDir}. Expected 3, got ${version}`
    );
  }

  const { actions, custom_types } = readActions(inputDir);

  const metadata: HasuraMetadataV3 = {
    version: 3,
    actions,
    custom_types,
    allowlist: readFile([inputDir, 'allow_list.yaml']) as AllowList[],
    cron_triggers: readFile([inputDir, 'cron_triggers.yaml']) as CronTrigger[],
    query_collections: readFile([
      inputDir,
      'cron_triggers.yaml',
    ]) as QueryCollectionEntry[],
    remote_schemas: readFile([
      inputDir,
      'remote_schemas.yaml',
    ]) as RemoteSchema[],
    // TODO: add typing for rest_endpoints
    // rest_endpoints: yaml.load(
    //   readFile(path.join(inputDir, "rest_endpoints.yaml"))
    // ) as RestEnpoints[],
    sources: readSources(inputDir),
  };

  return metadata;
}
