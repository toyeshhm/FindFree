module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);
  return {
    presets: isTest ? ['@react-native/babel-preset'] : ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: { '@': './src' },
      }],
      ...(isTest ? [] : ['react-native-reanimated/plugin']),
    ],
  };
};
