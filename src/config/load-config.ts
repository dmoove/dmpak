import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';

import { buildToolSchema } from '../generators/tool-registry.js';

/**
 * Zod schema describing the structure of `.dmpakrc` configuration files.
 */
export const dmpakConfigSchema = z.object({
  ci: z.enum(['github', 'gitlab']).optional(),
  dependencies: z
    .object({
      dependencies: z.record(z.string(), z.string()).optional(),
      devDependencies: z.record(z.string(), z.string()).optional(),
      optionalDependencies: z.record(z.string(), z.string()).optional(),
      peerDependencies: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  packageManager: z.enum(['pnpm', 'npm', 'yarn']).optional(),
  projectAuthor: z.string().optional(),
  projectDescription: z.string().optional(),
  projectHomepage: z.string().optional(),
  projectKeywords: z.array(z.string()).optional(),
  projectLicense: z.string().optional(),
  projectName: z.string(),
  projectRepository: z.string().optional(),
  projectType: z.enum(['cdk-app', 'cdk-lib', 'ts-lib']),
  projectVersion: z.string().optional(),
  release: z.enum(['changesets', 'semantic-release']).optional(),
  tools: buildToolSchema(),
});

export type DmpakConfig = z.infer<typeof dmpakConfigSchema>;

const CONFIG_FILES = [
  '.dmpakrc.mjs',
  '.dmpakrc.js',
  '.dmpakrc.ts',
  '.dmpakrc.cjs',
  '.dmpakrc.json',
  '.dmpakts.ts',
  '.dmpakts.cjs',
];

/**
 * Load the dmpak configuration from the current working directory.
 *
 * @param cwd - Directory to search for configuration files
 * @returns The parsed configuration
 */
export async function loadDmpakConfig(
  cwd = process.cwd()
): Promise<DmpakConfig> {
  let tsxRegistered = false;
  for (const filename of CONFIG_FILES) {
    const path = resolve(cwd, filename);
    if (!existsSync(path)) continue;

    const fileUrl = pathToFileURL(path).href;
    let rawConfig: unknown;

    try {
       
      if (filename.endsWith('.ts')) {
        if (!tsxRegistered) {
          // eslint-disable-next-line no-await-in-loop
          const { register } = await import('tsx/esm/api');
          register();
          tsxRegistered = true;
        }

        // eslint-disable-next-line no-await-in-loop
        const { tsImport } = await import('tsx/esm/api');
        // Node <18.19 requires file:// URLs on Windows; using the resolved path
        // on other platforms avoids duplicated extensions.
        const specifier = process.platform === 'win32' ? fileUrl : path;
        // eslint-disable-next-line no-await-in-loop
        const imported = await tsImport(specifier, import.meta.url);
        rawConfig = imported.default?.default ?? imported.default ?? imported;
      } else {
        // eslint-disable-next-line no-await-in-loop
        const imported = await import(fileUrl);
        rawConfig = imported.default ?? imported;
      }
    } catch (error) {
      throw new Error(`Failed to load ${filename}: ${error}`);
    }

    const parseResult = dmpakConfigSchema.safeParse(rawConfig);
    if (!parseResult.success) {
      throw new Error(
        `Invalid config in ${filename}:\n${JSON.stringify(
          parseResult.error.format(),
          null,
          2
        )}`
      );
    }

    const cfg = parseResult.data;
    if (!cfg.packageManager) cfg.packageManager = 'pnpm';
    return cfg;
  }

  throw new Error(`No dmpak config found in ${cwd}`);
}
