module.exports = {
  "parser": "babel-eslint",
  "env": {
    "browser": true,
    "es6": true,
    "node": true,
    "jest": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module"
  },
  "ecmaFeatures": {
    "destructuring": true
  },
  plugins: [
    'testcafe'
  ],
  "extends": "plugin:testcafe/recommended",
  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": 'off',
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ],
    'no-console': 'off',
    'no-debugger': 'off',
    "experimentalDecorators": true
  },
};
