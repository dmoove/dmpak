import { z } from 'zod';

import { CdkAppGenerator } from './cdk/cdk-app-generator.js';
import { CdkLibGenerator } from './cdk/cdk-lib-generator.js';
import { EslintGenerator } from './eslint/eslint-generator.js';
import { GitGenerator } from './git/git-generator.js';
import { PackageJsonGenerator } from './package-json/package-json-generator.js';
import { PrettierGenerator } from './prettier/prettier-generator.js';
import { TsConfigGenerator } from './tsconfig/tsconfig-generator.js';

/**
 * List of all available tool generators.
 */
export const toolGenerators = [
  CdkAppGenerator,
  CdkLibGenerator,
  EslintGenerator,
  GitGenerator,
  PackageJsonGenerator,
  PrettierGenerator,
  TsConfigGenerator,
];

/**
 * Build a Zod schema describing the configuration for all available tools.
 */
export function buildToolSchema(): z.AnyZodObject {
  const entries = toolGenerators
    .filter((g) => Boolean(g.configSchema))
    .map((g) => [g.prototype.name, g.configSchema!.optional()]);

  return z.object(Object.fromEntries(entries));
}
