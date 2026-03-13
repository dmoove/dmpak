import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { pascalCase } from '../../utils/string.js';
import { GeneratorConfig } from '../tool-generator.js';
import { CdkCommon } from './cdk-common.js';

/**
 * Generates scaffolding for an AWS CDK construct library.
 */
export class CdkLibGenerator extends CdkCommon {
  name = 'cdk-lib';

  /**
   * Create the construct library structure and update dependencies.
   */
  async generate(config: GeneratorConfig): Promise<void> {
    this.dryRun = config.dryRun ?? false;

    const name = config.projectName || 'cdk-lib';
    const pascal = pascalCase(name);

    await this.ensureDirs(['lib', 'test']);

    const libContent = `import { Construct } from 'constructs';

export interface ${pascal}Props {}

export class ${pascal} extends Construct {
  constructor(scope: Construct, id: string, props: ${pascal}Props = {}) {
    super(scope, id);
  }
}
`;
    await this.writeTextFile('lib/index.ts', libContent);

    const testContent = `import { App, Stack } from 'aws-cdk-lib';
import { ${pascal} } from '../lib/index.js';

test('construct compiles', () => {
  const app = new App();
  const stack = new Stack(app, 'TestStack');
  new ${pascal}(stack, '${pascal}');
});
`;
    await this.writeTextFile('test/sample.test.ts', testContent);

    await this.writeTextFile(
      'README.md',
      `# ${pascal}

Reusable AWS CDK construct library.

## Example

\`\`\`ts
import { ${pascal} } from '${name}';

new ${pascal}(scope, 'MyConstruct');
\`\`\`
`
    );

    this.addPeerDependencies(); // Important for libraries
  }

  override shouldRun(config: GeneratorConfig): boolean {
    return config.projectType === 'cdk-lib';
  }

  private async ensureDirs(dirs: string[]): Promise<void> {
    await Promise.all(
      dirs.map((dir) =>
        mkdir(resolve(this.projectRoot, dir), { recursive: true })
      )
    );
  }
}
