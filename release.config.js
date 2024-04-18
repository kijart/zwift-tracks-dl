module.exports = {
  tagFormat: '${version}',
  plugins: [
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/git',
      {
        assets: ['package.json'],
        message: 'chore(release): v${nextRelease.version}',
      },
    ],
  ],
};
