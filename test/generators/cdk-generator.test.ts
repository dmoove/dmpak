import { expect } from 'chai';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CdkAppGenerator } from '../../src/generators/cdk/cdk-app-generator.js';
import { AWS_CDK_VERSION } from '../../src/generators/cdk/cdk-common.js';
import { CdkLibGenerator } from '../../src/generators/cdk/cdk-lib-generator.js';
import { PackageJsonGenerator } from '../../src/generators/package-json/package-json-generator.js';

describe('CdkGenerator', () => {
  it('rejects a projectName containing shell metacharacters', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-cdkapp-'));
    const pkg = new PackageJsonGenerator(dir);
    const gen = new CdkAppGenerator(dir, pkg);

    try {
      await gen.generate({
        projectName: '$(evil)',
        projectType: 'cdk-app',
        tools: {},
      });
      expect.fail('should have thrown');
    } catch (error: unknown) {
      expect(error).to.be.instanceOf(Error);
      expect((error as Error).message).to.include('Invalid projectName');
    }
  });


  it('creates app files and dependencies for cdk-app', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-cdkapp-'));
    const pkg = new PackageJsonGenerator(dir);
    const gen = new CdkAppGenerator(dir, pkg);

    await gen.generate({
      projectName: 'demo',
      projectType: 'cdk-app',
      tools: {},
    });
    await pkg.generate({
      projectName: 'demo',
      projectType: 'cdk-app',
      tools: {},
    });

    const cdkCfg = JSON.parse(await fs.readFile(join(dir, 'cdk.json'), 'utf8'));
    const pkgJson = JSON.parse(
      await fs.readFile(join(dir, 'package.json'), 'utf8')
    );

    expect(cdkCfg.app).to.equal('npx ts-node --prefer-ts-exts bin/demo.ts');
    expect(pkgJson.dependencies).to.have.property(
      'aws-cdk-lib',
      AWS_CDK_VERSION
    );
    expect(
      await fs.stat(join(dir, 'bin/demo.ts')).then(
        () => true,
        () => false
      )
    ).to.equal(true);
  });

  it('creates library files and peer dependencies for cdk-lib', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-cdklib-'));
    const pkg = new PackageJsonGenerator(dir);
    const gen = new CdkLibGenerator(dir, pkg);

    await gen.generate({
      projectName: 'demo',
      projectType: 'cdk-lib',
      tools: {},
    });
    await pkg.generate({
      projectName: 'demo',
      projectType: 'cdk-lib',
      tools: {},
    });

    const pkgJson = JSON.parse(
      await fs.readFile(join(dir, 'package.json'), 'utf8')
    );

    expect(pkgJson.dependencies).to.have.property(
      'aws-cdk-lib',
      AWS_CDK_VERSION
    );
    expect(
      await fs.stat(join(dir, 'lib/index.ts')).then(
        () => true,
        () => false
      )
    ).to.equal(true);
  });
});
