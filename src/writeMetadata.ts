import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { HasuraMetadataV3 } from './HasuraMetadataV3';

function writeFile(outputPath: string[], file: any, yamlDump = true) {
  try {
    fs.writeFileSync(
      path.join(...outputPath),
      yamlDump
        ? yaml.dump(file, { noArrayIndent: true, quotingType: '"' })
        : file
    );
  } catch (error) {
    throw error;
  }
}

function clearDirectory(outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (fs.existsSync(path.join(outputDir, 'databases'))) {
    fs.rmdirSync(path.join(outputDir, 'databases'), { recursive: true });
  }
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
  writeFile([outputDir, 'actions.yaml'], {
    actions: metadata.actions,
    custom_types: metadata.custom_types,
  });
  writeFile([outputDir, 'allow_list.yaml'], metadata.allowlist);
  writeFile([outputDir, 'cron_triggers.yaml'], metadata.cron_triggers);
  writeFile([outputDir, 'query_collections.yaml'], metadata.query_collections);
  writeFile([outputDir, 'remote_schemas.yaml'], metadata.remote_schemas);
  console.warn('writing out empty rest_endpoints.yaml file. TODO: fix this.');
  writeFile([outputDir, 'rest_endpoints.yaml'], []);

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
  });
}
