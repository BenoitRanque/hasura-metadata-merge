import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { HasuraMetadataV3, Action } from './HasuraMetadataV3';
import { CustomTypes } from '@hasura/metadata';
import { getActionDefinitionSdl, getTypesSdl } from './shared/utils/sdlUtils';
import { reformCustomTypes } from './shared/utils/hasuraCustomTypeUtils';

function writeFile(outputPath: string[], file: any, yamlDump = true) {
  try {
    fs.writeFileSync(
      path.join(...outputPath),
      yamlDump
        ? yaml.dump(file, { noArrayIndent: true, quotingType: `'` })
        : file
    );
  } catch (error) {
    throw error;
  }
}

function clearDirectory(outputDir: string): void {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir);
}

function writeActions(
  outputDir: string,
  {
    actions = [],
    custom_types = reformCustomTypes([]),
  }: { actions: Action[] | undefined; custom_types: CustomTypes | undefined }
) {
  const sdl = actions
    .map((a) =>
      getActionDefinitionSdl(
        a.name,
        a.definition.type,
        a.definition.arguments,
        a.definition.output_type,
        a.comment
      )
    )
    .concat([getTypesSdl(custom_types)])
    .join('');

  writeFile([outputDir, 'actions.graphql'], sdl, false);

  // remove data that does not belong in actions.yaml
  const ymlPayload = {
    actions: actions.map((action) => {
      delete action.definition.type;
      delete action.definition.arguments;
      delete action.definition.output_type;

      return action;
    }),
    custom_types: {
      enums:
        custom_types.enums?.map(({ name, description }) => ({
          name,
          description,
        })) ?? [],
      input_objects:
        custom_types.input_objects?.map(({ name, description }) => ({
          name,
          description,
        })) ?? [],
      objects:
        custom_types.objects?.map(({ name, description, relationships }) => ({
          name,
          description,
          relationships,
        })) ?? [],
      scalars:
        custom_types.scalars?.map(({ name, description }) => ({
          name,
          description,
        })) ?? [],
    },
  };
  writeFile([outputDir, 'actions.yaml'], ymlPayload);
}

export function writeMetadata(
  outputDir: string,
  metadata: HasuraMetadataV3
): void {
  console.log('Clearing output directory');
  clearDirectory(outputDir);

  console.log('Writing output metadata');
  writeFile([outputDir, 'version.yaml'], {
    version: metadata.version,
  });
  writeActions(outputDir, {
    actions: metadata.actions,
    custom_types: metadata.custom_types,
  });
  writeFile([outputDir, 'allow_list.yaml'], metadata.allowlist);
  writeFile([outputDir, 'cron_triggers.yaml'], metadata.cron_triggers);
  writeFile([outputDir, 'query_collections.yaml'], metadata.query_collections);
  writeFile([outputDir, 'remote_schemas.yaml'], metadata.remote_schemas);
  writeFile([outputDir, 'rest_endpoints.yaml'], metadata.rest_endpoints);

  if (metadata.api_limits) {
    writeFile([outputDir, 'api_limits.yaml'], metadata.api_limits);
  }
  if (metadata.inherited_roles) {
    writeFile([outputDir, 'inherited_roles.yaml'], metadata.inherited_roles);
  }

  fs.mkdirSync(path.join(outputDir, 'databases'));

  writeFile(
    [outputDir, 'databases', 'databases.yaml'],

    metadata.sources.map((source) => ({
      ...source,
      tables: `!include ${source.name}/tables/tables.yaml`,
    }))
  );

  metadata.sources.forEach((source) => {
    fs.mkdirSync(path.join(outputDir, 'databases', source.name));
    fs.mkdirSync(path.join(outputDir, 'databases', source.name, 'tables'));

    writeFile(
      [outputDir, 'databases', source.name, 'tables', 'tables.yaml'],

      source.tables.map(
        (table) => `!include ${table.table.schema}_${table.table.name}.yaml`
      )
    );

    source.tables.forEach((table) => {
      writeFile(
        [
          outputDir,
          'databases',
          source.name,
          'tables',
          `${table.table.schema}_${table.table.name}.yaml`,
        ],
        table
      );
    });

    if (source.functions) {
      fs.mkdirSync(path.join(outputDir, 'databases', source.name, 'functions'));

      writeFile(
        [outputDir, 'databases', source.name, 'functions', 'functions.yaml'],
        source.functions.map((fn) =>
          typeof fn.function === 'string'
            ? `!include ${fn.function}.yaml`
            : `!include ${fn.function.schema}_${fn.function.name}.yaml`
        )
      );

      source.functions.forEach((fn) => {
        writeFile(
          [
            outputDir,
            'databases',
            source.name,
            typeof fn.function === 'string'
              ? `${fn.function}.yaml`
              : `${fn.function.schema}_${fn.function.name}.yaml`,
          ],
          fn
        );
      });
    }
  });
}
