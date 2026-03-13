import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { simpleGit } from 'simple-git';

import { DEFAULT_IGNORE_ENTRIES, GeneratorConfig, ToolGenerator } from '../tool-generator.js';

/**
 * Handles creation of a `.gitignore` and repository initialization.
 */
export class GitGenerator extends ToolGenerator {
  name = 'git';

  /**
   * Generate git related files and optionally initialize a repository.
   */
  async generate(config: GeneratorConfig): Promise<void> {
    this.dryRun = config.dryRun ?? false;

    const entries = [
      ...DEFAULT_IGNORE_ENTRIES,
      'tmp',
      '*-debug.log',
      '*-error.log',
      '**/.DS_Store',
      '.idea',
    ];

    await this.appendToIgnoreFile('.gitignore', ...entries);

    if (config.isInit) {
      const gitDir = resolve(this.projectRoot, '.git');
      if (this.dryRun) {
        console.log(`[dry-run] would run git init in ${this.projectRoot}`);
      } else if (!existsSync(gitDir)) {
        const git = simpleGit(this.projectRoot);
        try {
          await git.init();
        } catch (error) {
          throw new Error(
            `Failed to initialize git repository in ${this.projectRoot}`,
            { cause: error }
          );
        }
      }
    }
  }

  /**
   * The git generator always runs.
   */
  shouldRun(): boolean {
    return true;
  }
}
