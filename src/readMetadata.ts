import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { HasuraMetadataV3, Source, Action } from './HasuraMetadataV3';
import {
  AllowList,
  CronTrigger,
  CustomTypes,
  InputObjectType,
  ObjectType,
  QueryCollectionEntry,
  RemoteSchema,
  TableEntry,
} from '@hasura/metadata';
import { graphql, parse } from 'graphql';

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

export function readMetadata(inputDir: string): HasuraMetadataV3 {
  const version = readFile([inputDir, 'version.yaml']) as {
    version: number;
  };

  if (!version || version.version !== 3) {
    throw new Error(
      `Incompatible metadata version in directory ${inputDir}. Expected 3, got ${version}`
    );
  }

  const { actions, custom_types } = readFile([inputDir, 'actions.yaml']) as {
    actions?: Action[];
    custom_types?: CustomTypes;
  };

  const metadata: HasuraMetadataV3 = {
    version: 3,
    // todo: include custom types from actions.graphql, and check them for duplicates
    // throw error if any types have the same names but are not the same.
    // if no errors are present, conatenate types into a single .graphql file
    // unsure if custom types should be property of top level metadata, actions property, or standalone.
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
