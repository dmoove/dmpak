import { spawn } from 'node:child_process';

/**
 * Install dependencies using the specified package manager.
 *
 * @param packageManager - Command like 'pnpm', 'npm', or 'yarn'
 */
export async function runInstall(packageManager: string): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(packageManager, ['install'], {
        shell: true,
        stdio: 'inherit',
      });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${packageManager} install failed with exit code ${code}`));
      });
      proc.on('error', reject);
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `${packageManager} is not installed. Install it or set packageManager in your config.`
      );
    }

    throw error instanceof Error ? error : new Error(String(error));
  }
}
