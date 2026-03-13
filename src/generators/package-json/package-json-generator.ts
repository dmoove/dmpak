import { GeneratorConfig, ToolGenerator } from '../tool-generator.js';
import { getBaseFields, getExportFields } from './get-fields.js';

/**
 * Writes the project's `package.json` file and collects dependencies from
 * other generators.
 */
export class PackageJsonGenerator extends ToolGenerator {
  name = 'package.json';
  private dependencies = new Map<string, string>();
  private devDependencies = new Map<string, string>();
  private optionalDependencies = new Map<string, string>();
  private peerDependencies = new Map<string, string>();
  private scripts: Record<string, string> = {};

  /** Register a runtime dependency for the generated `package.json`. */
  addDependency(pkg: string, version: string): void {
    this.dependencies.set(pkg, version);
  }

  /** Register a dev dependency for the generated `package.json`. */
  addDevDependency(pkg: string, version: string): void {
    this.devDependencies.set(pkg, version);
  }

  /** Register an optional dependency for the generated `package.json`. */
  addOptionalDependency(pkg: string, version: string): void {
    this.optionalDependencies.set(pkg, version);
  }

  /** Register a peer dependency for the generated `package.json`. */
  addPeerDependency(pkg: string, version: string): void {
    this.peerDependencies.set(pkg, version);
  }

  /** Register a script for the generated `package.json`. */
  addScript(name: string, command: string): void {
    if (this.scripts[name]) {
      throw new Error(`Script "${name}" already exists in package.json`);
    }

    this.scripts[name] = command;
  }

  /**
   * Generate the `package.json` file based on collected information.
   */
  async generate(config: GeneratorConfig): Promise<void> {
    this.dryRun = config.dryRun ?? false;

    const base = getBaseFields(config);
    const scripts = { ...this.scripts, ...config.scripts } as Record<string, string>;
    const exports = getExportFields(config);
    const extraDeps = (config.dependencies ?? {}) as Record<
      string,
      Record<string, string>
    >;

    const pkg: Record<string, unknown> = {
      ...base,
      scripts,
      ...exports,
      dependencies: this.mergeDeps(
        extraDeps.dependencies ?? {},
        this.dependencies
      ),
      devDependencies: this.mergeDeps(
        {
          ...this.getDefaultDevDeps(),
          ...extraDeps.devDependencies,
        },
        this.devDependencies
      ),
    };

    if (this.peerDependencies.size > 0 || extraDeps.peerDependencies) {
      pkg.peerDependencies = this.mergeDeps(
        extraDeps.peerDependencies ?? {},
        this.peerDependencies
      );
    }

    if (this.optionalDependencies.size > 0 || extraDeps.optionalDependencies) {
      pkg.optionalDependencies = this.mergeDeps(
        extraDeps.optionalDependencies ?? {},
        this.optionalDependencies
      );
    }

    await this.writeJsonFile('package.json', pkg);
  }

  /** Default devDependencies that are always included. */
  protected getDefaultDevDeps(): Record<string, string> {
    return {
      typescript: '^5.3.3',
    };
  }

  /** The package.json generator always runs. */
  shouldRun(): boolean {
    return true;
  }

  /**
   * Merge base dependencies with those collected by other generators.
   */
  private mergeDeps(
    base: Record<string, string> = {},
    extras: Map<string, string>
  ): Record<string, string> {
    const result = { ...base };
    for (const [name, version] of extras) {
      result[name] = version;
    }

    return result;
  }
}
