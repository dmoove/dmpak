import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';

import type { DmpakConfig } from '../config/load-config.js';

export const DEFAULT_IGNORE_ENTRIES = [
  'node_modules',
  'dist',
  'build',
  'coverage',
];

/**
 * Configuration passed to each generator.
 */
export interface GeneratorConfig extends DmpakConfig {
  /** When true, log what would be written without actually writing any files */
  dryRun?: boolean;
  exports?: {
    exports?: Record<string, unknown>;
    files?: string[];
    main?: string;
    types?: string;
  };
  /** Indicates that generation is triggered during `dmpak init` */
  isInit?: boolean;
  projectHomepage?: string;
  projectKeywords?: string[];
  projectRepository?: string;
  scripts?: Record<string, string>;
}

/**
 * Base class for all generators.
 */
export abstract class ToolGenerator {
  /** Set to true during a dry-run to suppress file writes. */
  protected dryRun = false;

  abstract name: string;

  constructor(protected readonly projectRoot: string) {}

  protected static isRecord(val: unknown): val is Record<string, unknown> {
    return typeof val === 'object' && val !== null && !Array.isArray(val);
  }

  /**
   * Optional Zod schema for tool specific configuration. Subclasses may
   * override this method.
   */
  static get configSchema(): undefined | z.ZodTypeAny {
    return undefined;
  }

  /**
   * Append entries to ignore files like `.gitignore` or `.npmignore`.
   *
   * @param filename - File that should be updated
   * @param entries - Paths or patterns that should be ignored
   */
  protected async appendToIgnoreFile(
    filename: string,
    ...entries: string[]
  ): Promise<void> {
    const path = resolve(this.projectRoot, filename);

    if (this.dryRun) {
      console.log(`[dry-run] would write ${path}`);
      return;
    }

    const existing = existsSync(path) ? await readFile(path, 'utf8') : '';

    const lines = new Set(
      existing
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    );

    for (const entry of entries) {
      lines.add(entry);
    }

    const newContent = [...lines].sort().join('\n') + '\n';
    await writeFile(path, newContent, 'utf8');
  }

  /**
   * Execute the generator.
   */
  abstract generate(config: GeneratorConfig): Promise<void>;

  /**
   * Optional default configuration for the tool.
   */
  protected getDefaultConfig(): Record<string, unknown> {
    return {};
  }

  /**
   * Merge the default configuration with the user provided configuration.
   */
  protected getMergedConfig(
    userConfig: boolean | Record<string, unknown>
  ): Record<string, unknown> {
    return typeof userConfig === 'object'
      ? { ...this.getDefaultConfig(), ...userConfig }
      : this.getDefaultConfig();
  }

  /**
   * Retrieves the configuration block for this tool from the global config
   */
  protected getToolConfig(
    config: Partial<GeneratorConfig>
  ): boolean | Record<string, unknown> {
    return config.tools?.[this.name] ?? false;
  }

  /**
   * Determine whether the generator should run.
   */
  abstract shouldRun(config: GeneratorConfig): boolean;

  /**
   * Helper to write JSON files with a trailing newline.
   */
  protected async writeJsonFile(
    filename: string,
    data: unknown
  ): Promise<void> {
    const path = resolve(this.projectRoot, filename);

    if (this.dryRun) {
      console.log(`[dry-run] would write ${path}`);
      return;
    }

    await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  /**
   * Helper to write plain text files.
   */
  protected async writeTextFile(
    filename: string,
    content: string
  ): Promise<void> {
    const path = resolve(this.projectRoot, filename);

    if (this.dryRun) {
      console.log(`[dry-run] would write ${path}`);
      return;
    }

    await writeFile(path, content, 'utf8');
  }
}
