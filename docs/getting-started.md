# Getting Started

## Project Generator

```bash
npx create-ream-app@beta my-app
```

When the installation is completed, follow the instructions to start the development server. Try editing `pages/index.vue` and see the result in your browser.

## Manual Setup

### Install via npm

```bash
npm install ream@beta
```

### Add npm scripts

```json
{
  "scripts": {
    "dev": "ream",
    "build": "ream build",
    "start": "ream start",
    "export": "ream export"
  }
}
```

The `export` script is only needed if you want to export static website.
