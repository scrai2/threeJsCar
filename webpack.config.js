const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: "./src/index.ts",
  mode: "development",
  devServer: {
    watchFiles: ["src/**/*"],
    port: 3010,
    allowedHosts: 'all',
    static: {
      directory: path.join(__dirname, 'model'),
      publicPath: '/model',
    },
    client: {
      overlay: true,
      reconnect: true,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        include: path.resolve(__dirname, "src"),
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader"
        ],
      },
      {
        test: /\.(png|svg|jpg|gif|jpeg|woff|woff2|ttf|eot|glb)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "assets/",
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/index.html", to: "index.html" },
        { from: "images", to: "images" },
        // { from: "models", to: "models" }, 
      ],
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
};
