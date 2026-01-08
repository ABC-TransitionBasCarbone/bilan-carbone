const postcssImport = require('postcss-import');

module.exports = {
  plugins: [
    postcssImport({
      filter: () => false,
    }),
    require('postcss-nested'),
    require('postcss-flexbugs-fixes'),
    require('postcss-preset-env')({
      autoprefixer: {
        flexbox: 'no-2009',
        grid: 'autoplace',
      },
      stage: 3,
      features: {
        'custom-properties': false,
      },
    }),
  ],
};
