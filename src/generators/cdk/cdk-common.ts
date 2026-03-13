import { PackageJsonGenerator } from '../package-json/package-json-generator.js';
import { ToolGenerator } from '../tool-generator.js';

export const AWS_CDK_VERSION = '^2.201.0';
export const CONSTRUCTS_VERSION = '^10.4.2';
export const TYPESCRIPT_VERSION = '^5.3.3';
export const NODE_TYPES_VERSION = '^20.11.17';
export const TS_NODE_VERSION = '^10.9.2';
export const JEST_VERSION = '^29.7.0';
export const TS_JEST_VERSION = '^29.2.5';
export const JEST_TYPES_VERSION = '^29.5.4';

/**
 * Shared helper logic for CDK generators.
 */
export abstract class CdkCommon extends ToolGenerator {
  constructor(
    projectRoot: string,
    protected readonly pkg: PackageJsonGenerator
  ) {
    super(projectRoot);
    this.setupDependencies();
    this.setupScripts();
  }

  protected addDevDependencies(): void {
    this.pkg.addDevDependency('typescript', TYPESCRIPT_VERSION);
    this.pkg.addDevDependency('ts-node', TS_NODE_VERSION);
    this.pkg.addDevDependency('@types/node', NODE_TYPES_VERSION);
    this.pkg.addDevDependency('jest', JEST_VERSION);
    this.pkg.addDevDependency('ts-jest', TS_JEST_VERSION);
    this.pkg.addDevDependency('@types/jest', JEST_TYPES_VERSION);
  }

  protected addPeerDependencies(): void {
    this.pkg.addPeerDependency('aws-cdk-lib', AWS_CDK_VERSION);
    this.pkg.addPeerDependency('constructs', CONSTRUCTS_VERSION);
  }

  protected addRuntimeDependencies(): void {
    this.pkg.addDependency('aws-cdk-lib', AWS_CDK_VERSION);
    this.pkg.addDependency('constructs', CONSTRUCTS_VERSION);
  }

  private setupDependencies(): void {
    this.addRuntimeDependencies();
    this.addDevDependencies();
  }

  private setupScripts(): void {
    this.pkg.addScript('build', 'tsc');
    this.pkg.addScript('test', 'jest');
  }
}
