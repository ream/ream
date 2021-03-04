# @ream/module-google-analytics

## Install

```bash
npm i @ream/module-google-analytics
# Or Yarn
yarn add @ream/module-google-analytics
```

## Usage

Add it to `ream.config.js`:

```ts
export default {
  modules: ['@ream/module-google-analytics'],
  env: {
    // Set your ga tracking ID
    GA_TRACKING_ID: 'UA-XXX-XXX',
    // Optional send anonymize ip
    GA_ANONYMIZE_IP: true,
  },
}
```

## License

MIT &copy; [EGOIST](https://github.com/sponsors/egoist)
