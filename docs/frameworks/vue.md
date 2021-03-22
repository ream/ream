# Vue Support

## Install

Required dependencies:

```bash
npm i vue@next @ream/framework-vue
```

If you're using `.vue` single-file component, you also need:

```bash
npm i -D @vue/compiler-sfc @vitejs/plugin-vue
```

If you want to enable server-side rendering, you also need:

```bash
npm i @vue/server-renderer
```

## Usage

Adding `@vitejs/plugin-vue` if you're using `.vue` file:

```ts
// ream.config.ts
import { defineConfig } from 'ream'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  vite(config) {
    config.plugins!.push(vue())
  },
})
```

Create app in `main.ts`:

```ts
// main.ts
import { RenderContext } from 'ream/app'
import { render } from '@ream/framework-vue'

export default (context: RenderContext) => {
  return render(context)
}
```

### Server-side rendering

Enable SSR in Ream config:

```ts
// ream.config.ts
import { defineConfig } from 'ream'

export default defineConfig({
  ssr: true,
})
```
