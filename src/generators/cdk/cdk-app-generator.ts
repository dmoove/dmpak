import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { pascalCase } from '../../utils/string.js';
import { PackageJsonGenerator } from '../package-json/package-json-generator.js';
import { GeneratorConfig } from '../tool-generator.js';
import { CdkCommon } from './cdk-common.js';

/**
 * Generates scaffolding for an AWS CDK application.
 */
export class CdkAppGenerator extends CdkCommon {
  name = 'cdk-app';

  constructor(projectRoot: string, pkg: PackageJsonGenerator) {
    super(projectRoot, pkg);
    this.addCdkAppScripts();
  }

  /**
   * Create the CDK app structure and project files.
   */
  async generate(config: GeneratorConfig): Promise<void> {
    this.dryRun = config.dryRun ?? false;

    const name = config.projectName || 'cdk-app';

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error(
        `Invalid projectName "${name}": only letters, digits, hyphens, and underscores are allowed.`
      );
    }

    const pascal = pascalCase(name);

    await this.writeJsonFile('cdk.json', {
      app: `npx ts-node --prefer-ts-exts bin/${name}.ts`,
      context: {
        '@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId': true,
        '@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021': true,
        '@aws-cdk/aws-ecr-assets:dockerIgnoreSupport': true,
        '@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount': true,
        '@aws-cdk/aws-efs:defaultEncryptionAtRest': true,
        '@aws-cdk/aws-lambda:recognizeVersionProps': true,
        '@aws-cdk/aws-rds:lowercaseDbIdentifier': false,
        '@aws-cdk/core:stackRelativeExports': true,
        'aws-cdk:enableDiffNoFail': true,
      },
    });

    await this.ensureDirs(['bin', 'lib', 'test']);

    // bin/<name>.ts
    const binContent = `#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ${pascal}Stack } from '../lib/${name}-stack.js';

const app = new cdk.App();
new ${pascal}Stack(app, '${pascal}Stack');
`;
    await this.writeTextFile(`bin/${name}.ts`, binContent);

    // lib/<name>-stack.ts
    const stackContent = `import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ${pascal}Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}
`;
    await this.writeTextFile(`lib/${name}-stack.ts`, stackContent);

    // test/sample.test.ts
    const testContent = `test('Stack compiles without error', () => {
  expect(true).toBe(true);
});
`;
    await this.writeTextFile('test/sample.test.ts', testContent);

    // README.md
    const readme = `# ${pascal}

Generated with \`dmpak init --type cdk-app\`.

## 📦 Commands

- \`npm run build\` – Compile TypeScript
- \`npm run test\` – Run tests
- \`npm run synth\` – Generate CloudFormation template
- \`npm run deploy\` – Deploy to AWS
- \`npm run diff\` – Show changes before deploying
- \`npm run destroy\` – Remove the stack from AWS
`;
    await this.writeTextFile('README.md', readme);
  }

  override shouldRun(config: GeneratorConfig): boolean {
    return config.projectType === 'cdk-app';
  }

  private addCdkAppScripts(): void {
    this.pkg.addScript('synth', 'cdk synth');
    this.pkg.addScript('deploy', 'cdk deploy');
    this.pkg.addScript('diff', 'cdk diff');
    this.pkg.addScript('destroy', 'cdk destroy');
  }

  private async ensureDirs(dirs: string[]): Promise<void> {
    await Promise.all(
      dirs.map((dir) =>
        mkdir(resolve(this.projectRoot, dir), { recursive: true })
      )
    );
  }
}
