const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');
require('dotenv').config()

const ENV = process.env.APP_ENV;
const isTest = ENV === 'test'
const isProd = ENV === 'prod';

function setDevTool() {
    if (isTest) {
      return 'inline-source-map';
    } else if (isProd) {
      return 'source-map';
    } else {
      return 'eval-source-map';
    }
}

const config = {
  entry: __dirname + "/src/truncate.js",
  output: {
    path: __dirname + '/dist',
    filename: 'truncate.js',
    publicPath: '/',
    pathinfo: true
  },
  devtool: setDevTool(),
  module: {
      rules: [
          {
            test: /\.js$/,
            use: 'babel-loader',
            exclude: [
              /node_modules/
            ]
          }
      ]
  },
  plugins: [],
  devServer: {
      contentBase: './dist',
      port: 7700,
  }
};

if(isProd) {
    config.plugins.push(
        new UglifyJSPlugin()
    );
};

module.exports = config;
