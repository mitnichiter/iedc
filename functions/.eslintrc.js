module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
    "require-jsdoc": "off",
  },
};