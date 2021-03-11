# @ream/module-google-analytics

## Install

```bash
npm i @ream/plugin-google-analytics
# Or Yarn
yarn add @ream/plugin-google-analytics
```

## Usage

Add it to `ream.config.js`:

```ts
import ga from '@ream/plugin-google-analytics'

export default {
  plugins: [ga()],

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
