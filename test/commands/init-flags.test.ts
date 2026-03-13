import { Flags, Parser } from '@oclif/core';
import { expect } from 'chai';

describe('init flags aliases', () => {
  it('parses -f and -t as aliases for --force and --type', async () => {
    const flags = {
      force: Flags.boolean({ char: 'f', default: false }),
      type: Flags.string({ char: 't', options: ['cdk-lib', 'cdk-app', 'ts-lib'], required: true }),
    } as const;

    const result = await Parser.parse(['-f', '-t', 'ts-lib'], { args: {}, flags });
    expect(result.flags.force).to.equal(true);
    expect(result.flags.type).to.equal('ts-lib');
  });

  it('parses --no-install flag', async () => {
    const flags = {
      'no-install': Flags.boolean({ default: false }),
      type: Flags.string({ char: 't', options: ['cdk-lib', 'cdk-app', 'ts-lib'], required: true }),
    } as const;

    const result = await Parser.parse(['--no-install', '-t', 'ts-lib'], { args: {}, flags });
    expect(result.flags['no-install']).to.equal(true);
  });
});
