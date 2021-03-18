# Getting Started

## Quick start

Use the `create-ream-app` package to quickly start a project:

```bash
npx create-ream-app my-app
```

When the installation is completed, follow the instructions to start the development server. Try editing `main.ts` and see the result in your browser.

## Slow start

- Step 1: Create and change into a new directory.

```bash
mkdir my-app && cd my-app
```

- Step 2: Initialize a `package.json` with your preferred package manager.

```bash
npm init -y
```

- Step 3: Install `ream` locally

```bash
npm i ream -D
```

- Step 4: Create the entry file `main.ts`

```ts
// You can define your own logic of how to start your app
// but as an example:

const div = document.createElement('div')
div.textContent = `Hello Ream!`
document.body.appendChild(div)
```

- Step 5: Add npm scripts to `package.json`

```json
{
  "scripts": {
    "dev": "ream",
    "build": "ream build",
    "start": "ream start"
  }
}
```

- Step 6: Run it!

```bash
npm run dev
```
