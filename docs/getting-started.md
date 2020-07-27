# Getting Started

## Project Generator

**NOT YET AVAILABLE**, use manual setup for now.

```bash
npm init ream-app my-app
```

After the installation is complete, follow the instructions to start the development server. Try editing `routes/index.vue` and see the result on your browser.

## Manual Setup

### Install via npm

```bash
npm install ream
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
