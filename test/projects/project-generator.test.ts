import { expect } from 'chai';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ProjectGenerator } from '../../src/projects/project-generator.js';

describe('ProjectGenerator', () => {
  it('generateAll creates expected files for ts-lib', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-proj-'));

    const gen = new ProjectGenerator(
      { isInit: true, projectName: 'demo', projectType: 'ts-lib', tools: {} },
      dir
    );
    await gen.generateAll();

    expect(
      await fs.stat(join(dir, 'package.json')).then(
        () => true,
        () => false
      )
    ).to.equal(true);

    expect(
      await fs.stat(join(dir, '.gitignore')).then(
        () => true,
        () => false
      )
    ).to.equal(true);
  });

  it('dry-run does not write any files', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'dmpak-proj-dry-'));

    const gen = new ProjectGenerator(
      { dryRun: true, projectName: 'demo', projectType: 'ts-lib', tools: {} },
      dir
    );
    await gen.generateAll();

    const entries = await fs.readdir(dir);
    expect(entries).to.deep.equal([]);
  });
});
