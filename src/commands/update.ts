import { Command, Flags } from '@oclif/core';

import { loadDmpakConfig } from '../config/load-config.js';
import { ProjectGenerator } from '../projects/project-generator.js';
import { runInstall } from '../utils/package-manager.js';

/**
 * Default command which regenerates all project files according to the
 * configuration.
 */
export default class Dmpak extends Command {
  static description = 'Regenerate project files based on .dmpakrc config';
  static flags = {
    'dry-run': Flags.boolean({
      default: false,
      description: 'Preview which files would be written without making changes',
    }),
    'no-install': Flags.boolean({
      default: false,
      description: 'Skip package manager installation after generating files',
    }),
  };

  /**
   * Execute the command.
   */
  async run(): Promise<void> {
    const { flags } = await this.parse(Dmpak);

    this.log('🔍 Loading .dmpakrc configuration...');
    const config = await loadDmpakConfig();
    this.log('✅ Configuration loaded.');

    const generator = new ProjectGenerator({
      ...config,
      dryRun: flags['dry-run'],
      isInit: false,
    });
    await generator.generateAll();

    if (!flags['dry-run'] && !flags['no-install']) {
      await runInstall(config.packageManager ?? 'pnpm');
    }

    this.log('🎉 Project updated successfully!');
  }
}
