# Environment Variables

## Built-in Variables

- `import.meta.env.MODE`: The mode the app is running in. By default it's `development` in dev and `production` in production build, however you can run `ream build` or `ream export` with the `--mode <custom_mode>` flag to set it to anything you want.
- `import.meta.env.PROD`: Whether the app is running in production
- `import.meta.env.DEV`: The opposite of `import.meta.env.PROD`.
- `import.meta.env.SSR`: Whether the code is running on server-side.
- `import.meta.env.REAM_ROOT_DIR`: The absolute path to the root directory of your project.
- `import.meta.env.REAM_SOURCE_DIR`: The absolute path to the source directory of your project.

## `.env` Files

Ream uses [dotenv](https://github.com/motdotla/dotenv) to load additional environment variables from the following files in your project root:

```
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified mode
.env.[mode].local   # only loaded in specified mode, ignored by git
```

Loaded env variables are also exposed to your client source code via `import.meta.env`.

To prevent accidentally leaking env variables to the client, only variables prefixed with `REAM_` are exposed to your Ream-processed code. e.g. the following file:

```
DB_PASSWORD=foobar
REAM_SOME_KEY=123
```

Only `REAM_SOME_KEY` will be exposed as `import.meta.env.REAM_SOME_KEY` to your client source code, but `DB_PASSWORD` will not.

**SECURITY NOTES**:

- `.env.*.local` files are local-only and can contain sensitive variables, i.e. You should add `.local` to your `.gitignore` to avoid them being checked into git.
- Since any variables exposed to your app source code will end up in your client bundle, `REAM_*` variables should not contain any sensitive information.

## Mode

By default the dev command runs in `development` mode, `build` command and `export` command run in `production` mode, this means Ream will try to load `.env.production` for a production build, however you might want a custom _mode_ for your production build, e.g. `staging`, to keep the production-like behavior, but with slightly different env variables from production.

You can overwrite the default mode used for a command by passing the `--mode` option flag. For example, if you want to build your app for our hypothetical staging mode:

```
ream build --mode staging
```

Ream will then load environments variable from `.env.staging`, now your staging app should have production-like behavior, but displaying a different title from production.
