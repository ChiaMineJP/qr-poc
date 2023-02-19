const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devtool: false,
  entry: {
    renderer: "./src/primaryWindow/script.ts",
    capture: "./src/captureWindow/script.ts",
  },
  target: "web",
  stats: "errors-only",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "./build"),
    filename: "[name].js",
    hashFunction: "sha256",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/primaryWindow/index.html",
      filename: "index.html",
      chunks: ["renderer"],
    }),
    new HtmlWebpackPlugin({
      template: "src/captureWindow/capture.html",
      filename: "capture.html",
      chunks: ["capture"],
    }),
  ]
};
