import { esbuildPlugin } from '@web/dev-server-esbuild';
import { fromRollup } from '@web/dev-server-rollup';
import rollupCommonjs from '@rollup/plugin-commonjs';

const commonjs = fromRollup(rollupCommonjs);

export default {
  nodeResolve: true,
  files: [
    'test/*.spec.js'
  ],
  plugins: [
    esbuildPlugin({ ts: true }),
    commonjs({ include: ['**/bind-decorator/*.js' ]})
  ]
};
