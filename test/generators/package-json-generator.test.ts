import { expect } from 'chai';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PackageJsonGenerator } from '../../src/generators/package-json/package-json-generator.js';
import { GeneratorConfig } from '../../src/generators/tool-generator.js';

describe('PackageJsonGenerator', () => {
  it('writes package.json with merged dependencies', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-pkg-'));
    const pkg = new PackageJsonGenerator(dir);
    pkg.addDependency('foo', '^1.0.0');
    pkg.addDevDependency('bar', '^2.0.0');
    pkg.addPeerDependency('baz', '^3.0.0');
    pkg.addOptionalDependency('qux', '^4.0.0');

    const config: GeneratorConfig = {
      dependencies: {
        dependencies: { express: '^5.0.0' },
        devDependencies: { eslint: '^8.0.0' },
      },
      projectName: 'demo',
      projectType: 'ts-lib',
      tools: {},
    };

    await pkg.generate(config);

    const raw = JSON.parse(await fs.readFile(join(dir, 'package.json'), 'utf8'));
    expect(raw.name).to.equal('demo');
    expect(raw.dependencies.foo).to.equal('^1.0.0');
    expect(raw.dependencies.express).to.equal('^5.0.0');
    expect(raw.devDependencies.bar).to.equal('^2.0.0');
    expect(raw.devDependencies.eslint).to.equal('^8.0.0');
    expect(raw.peerDependencies.baz).to.equal('^3.0.0');
    expect(raw.optionalDependencies.qux).to.equal('^4.0.0');
  });

  it('includes homepage, repository and keywords from config', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-pkg-'));
    const pkg = new PackageJsonGenerator(dir);

    const config: GeneratorConfig = {
      projectHomepage: 'https://example.com',
      projectKeywords: ['foo', 'bar'],
      projectName: 'demo',
      projectRepository: 'user/demo',
      projectType: 'ts-lib',
      tools: {},
    };

    await pkg.generate(config);

    const raw = JSON.parse(await fs.readFile(join(dir, 'package.json'), 'utf8'));
    expect(raw.homepage).to.equal('https://example.com');
    expect(raw.repository).to.equal('user/demo');
    expect(raw.keywords).to.deep.equal(['foo', 'bar']);
  });

  it('omits optional fields when not provided', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-pkg-'));
    const pkg = new PackageJsonGenerator(dir);

    const config: GeneratorConfig = {
      projectName: 'demo',
      projectType: 'ts-lib',
      tools: {},
    };

    await pkg.generate(config);

    const raw = JSON.parse(await fs.readFile(join(dir, 'package.json'), 'utf8'));
    expect(raw).to.not.have.property('author');
    expect(raw).to.not.have.property('description');
    expect(raw).to.not.have.property('homepage');
    expect(raw).to.not.have.property('keywords');
    expect(raw).to.not.have.property('repository');
  });

  it('merges scripts from config and generators', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-pkg-'));
    const pkg = new PackageJsonGenerator(dir);
    pkg.addScript('build', 'tsc');

    const config: GeneratorConfig = {
      projectName: 'demo',
      projectType: 'ts-lib',
      scripts: { test: 'jest' },
      tools: {},
    };

    await pkg.generate(config);

    const raw = JSON.parse(await fs.readFile(join(dir, 'package.json'), 'utf8'));
    expect(raw.scripts).to.deep.equal({ build: 'tsc', test: 'jest' });
  });
});
