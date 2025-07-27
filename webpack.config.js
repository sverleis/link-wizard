const path = require('path');

module.exports = {
  entry: './admin/src/index.js',
  output: {
    path: path.resolve(__dirname, 'admin/build'),
    filename: 'link-wizard-admin.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
