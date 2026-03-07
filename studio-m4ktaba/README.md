# Sanity Blogging Content Studio

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- Check out the example frontend: [React/Next.js](https://github.com/sanity-io/tutorial-sanity-blog-react-next)
- [Read the blog post about this template](https://www.sanity.io/blog/build-your-own-blog-with-sanity-and-next-js?utm_source=readme)
- [Join the community Slack](https://slack.sanity.io/?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)

### If `pnpm start` or `pnpm run dev` fails with ETIMEDOUT (connection timed out, read/write)

This often happens when the project is on iCloud Drive (e.g. Desktop). Use the local dev script so the runtime is written to `/tmp` instead:

```bash
pnpm run dev:local
```

Alternatively, move the project to a folder that is not synced (e.g. `~/Projects/m4ktaba`).
