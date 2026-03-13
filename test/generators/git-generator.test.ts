import { expect } from 'chai';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { GitGenerator } from '../../src/generators/git/git-generator.js';

describe('GitGenerator', () => {
  it('does not initialize git when dryRun is true', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-git-'));
    const gen = new GitGenerator(dir);

    await gen.generate({ dryRun: true, isInit: true, projectName: 'demo', projectType: 'ts-lib', tools: {} });

    const gitDir = join(dir, '.git');
    expect(await fs.stat(gitDir).catch(() => null)).to.equal(null);
  });


  it('creates .gitignore and initializes repo during init', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-git-'));
    const gen = new GitGenerator(dir);

    await gen.generate({ isInit: true, projectName: 'demo', projectType: 'ts-lib', tools: {} });

    const ignorePath = join(dir, '.gitignore');
    const gitDir = join(dir, '.git');

    expect(await fs.readFile(ignorePath, 'utf8')).to.contain('node_modules');
    expect((await fs.stat(gitDir)).isDirectory()).to.equal(true);
  });

  it('skips git init when not running init', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-git-'));
    const gen = new GitGenerator(dir);

    await gen.generate({ isInit: false, projectName: 'demo', projectType: 'ts-lib', tools: {} });

    const gitDir = join(dir, '.git');
    expect(await fs.stat(gitDir).catch(() => null)).to.equal(null);
  });
});
