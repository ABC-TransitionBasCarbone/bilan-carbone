import postcssFlexbugsFixes from 'postcss-flexbugs-fixes'
import postcssImport from 'postcss-import'
import postcssNested from 'postcss-nested'
import postcssPresetEnv from 'postcss-preset-env'

export default {
  plugins: [
    postcssImport({
      filter: () => false,
    }),
    postcssNested,
    postcssFlexbugsFixes,
    postcssPresetEnv({
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
}
