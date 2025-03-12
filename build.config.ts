import { defineBuildConfig } from 'unbuild'
import {peerDependencies} from './package.json'

export default defineBuildConfig({
  entries: [
    'src/index.ts',
  ],
  clean: true,
  declaration: 'node16',
  rollup: {
    dts: {
      respectExternal: true,
    },
  },
  externals: [
    ...Object.keys(peerDependencies),
  ],
})