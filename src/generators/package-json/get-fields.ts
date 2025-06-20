import type { GeneratorConfig } from '../tool-generator.js';

/**
 * Basic `package.json` fields derived from the global configuration.
 */
export function getBaseFields(
  config: Partial<GeneratorConfig>
): Record<string, unknown> {
  return {
    ...(config.projectAuthor ? { author: config.projectAuthor } : {}),
    ...(config.projectDescription
      ? { description: config.projectDescription }
      : {}),
    ...(config.projectHomepage ? { homepage: config.projectHomepage } : {}),
    ...(config.projectKeywords ? { keywords: config.projectKeywords } : {}),
    license: config.projectLicense || 'MIT',
    name: config.projectName || 'my-project',
    private: true,
    ...(config.projectRepository
      ? { repository: config.projectRepository }
      : {}),
    type: 'module',
    version: config.projectVersion || '0.1.0',
  };
}

/**
 * Determine export related fields for `package.json`.
 */
export function getExportFields(
  config: Partial<GeneratorConfig>
): Record<string, unknown> {
  const { exports: exp, files, main, types } = config.exports || {};

  const anyDefined = main || types || exp || files;
  const allDefined = main && types && exp && files;

  if (anyDefined && !allDefined) {
    throw new Error(
      'Invalid "exports" config in .dmpakrc: If any of main/types/exports/files are set, all must be set.'
    );
  }

  if (allDefined) {
    return {
      exports: exp,
      files,
      main,
      types,
    };
  }

  // Defaults, if nothing provided
  if (config.projectType === 'ts-lib' || config.projectType === 'cdk-lib') {
    return {
      exports: {
        '.': {
          import: './dist/index.js',
          types: './dist/index.d.ts',
        },
      },
      files: ['dist'],
      main: './dist/index.js',
      types: './dist/index.d.ts',
    };
  }

  return {};
}

/**
 * Convert a `Map` to a plain object.
 */
export function toObject(map: Map<string, string>): Record<string, string> {
  return Object.fromEntries(map.entries());
}
