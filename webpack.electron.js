const path = require("path");

module.exports = {
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devtool: false,
  entry: {
    main: "./src/main.ts",
    preload: "./src/primaryWindow/preload.ts",
    preload_capture: "./src/captureWindow/preload_capture.ts",
  },
  target: "electron-main",
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
};
