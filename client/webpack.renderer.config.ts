import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import path from  'pathe';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias:{
      BridgeHelper: path.resolve(__dirname, 'src/BridgeHelper'),
      '@/src': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, '.'),
    },
    plugins: [new TsconfigPathsPlugin({
      configFile: './tsconfig.json'
    })],
  },
};
