# Parked

The former TanStack plugin directory, preserved as reference code. It is
excluded from the Astro build, dependency scan, type checks, and lint.

The live directory is at https://plugins.omarchy.org. The build creates
redirects for every old `/plugins/...` address in
`scripts/assemble-static.mjs`.

Restoring an integrated directory requires Astro pages under `src/pages/plugins/`,
loaders using `src/astro/data.ts`, and React components using the current
navigation helpers. The old TanStack route files cannot be moved into Astro
unchanged. Remove the matching redirects and update plugin card/search links
only once replacement pages are built and checked.
