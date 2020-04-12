const {
  override,
  addDecoratorsLegacy,
  // disableEsLint,
  useEslintRc,
  addBundleVisualizer,
  // addWebpackAlias,
  // adjustWorkbox
} = require("customize-cra");
const path = require("path");

module.exports = override(
  // enable legacy decorators babel plugin
  addDecoratorsLegacy(),

  // disable eslint in webpack
  useEslintRc(),

  // add webpack bundle visualizer if BUNDLE_VISUALIZE flag is enabled
  process.env.BUNDLE_VISUALIZE == 1 && addBundleVisualizer()
);
