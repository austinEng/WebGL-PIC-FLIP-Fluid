module.exports = {
  entry: {
    "example/flip": "./example/flip/index.js"
  },
  output: {
      path: __dirname,
      filename: "[name]/bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  devtool: 'source-map'
};