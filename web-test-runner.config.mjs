import { esbuildPlugin } from '@web/dev-server-esbuild';
import { fromRollup } from '@web/dev-server-rollup';
import { a11ySnapshotPlugin, sendKeysPlugin } from '@web/test-runner-commands/plugins';
import rollupCommonjs from '@rollup/plugin-commonjs';

const commonjs = fromRollup(rollupCommonjs);

export default {
  nodeResolve: true,
  files: [
    'test/*.spec.ts',
  ],
  plugins: [
    sendKeysPlugin(),
    a11ySnapshotPlugin(),
    esbuildPlugin({ ts: true }),
    commonjs({ include: ['**/bind-decorator/*.js'] }),
  ],
};
