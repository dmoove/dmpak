import { Command, Flags } from '@oclif/core';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import { loadDmpakConfig } from '../config/load-config.js';
import { ProjectGenerator } from '../projects/project-generator.js';
import { runInstall } from '../utils/package-manager.js';

/**
 * Initialize a new project by creating a configuration file and generating
 * default project files.
 */
export default class Init extends Command {
  static description = 'Create a new .dmpakrc.mjs and generate project files';
  static flags = {
    force: Flags.boolean({
      char: 'f',
      default: false,
      description: 'Overwrite existing configuration',
    }),
    'no-install': Flags.boolean({
      default: false,
      description: 'Skip package manager installation after generating files',
    }),
    type: Flags.string({
      char: 't',
      description: 'Project template type',
      options: ['cdk-lib', 'cdk-app', 'ts-lib'],
      required: true,
    }),
  };

  /**
   * Execute the command.
   */
  async run(): Promise<void> {
    const { flags } = await this.parse(Init);
    const file = resolve(process.cwd(), '.dmpakrc.ts');

    if (existsSync(file) && !flags.force) {
      this.error('.dmpakrc.ts already exists. Use --force to overwrite.');
      return;
    }

    const name = basename(process.cwd());
    const content = `import type { DmpakConfig } from 'dmpak';

const config: DmpakConfig = {
  projectName: '${name}',
  projectType: '${flags.type}',
  tools: { eslint: true, prettier: true },
};

export default config;
`;

    await writeFile(file, content, 'utf8');
    this.log('✅ Created .dmpakrc.ts');

    const config = await loadDmpakConfig();
    const generator = new ProjectGenerator({ ...config, isInit: true });
    await generator.generateAll();

    if (!flags['no-install']) {
      await runInstall(config.packageManager ?? 'pnpm');
    }

    this.log('🎉 Project initialized successfully!');
  }
}
