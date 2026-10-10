import { resolve } from 'node:path';
import ts from 'typescript';

export function readAliases(): { find: RegExp; replacement: string }[] {
  const { config } = ts.readConfigFile(resolve('tsconfig.json'), ts.sys.readFile);
  const paths: Record<string, string[]> = config.compilerOptions.paths;

  return Object.entries(paths).map(([pattern, [target]]) => {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\/]/g, (char) => (char === '*' ? '(.*)' : `\\${char}`));
    return {
      find: new RegExp(`^${escaped}$`),
      replacement: resolve(pattern.endsWith('*') ? target!.replace('*', '$1') : target!),
    };
  });
}
