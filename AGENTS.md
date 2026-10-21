# AGENTS.md

How to build, check and edit the site is in [README.md](README.md). Languages,
domains and their deployments are in [docs/translations.md](docs/translations.md).

## Never hardcode the site's own domain

One build is served from many domains, not just omarchy.org:

- a country domain or language subdomain for each edition in
  `src/i18n/locales.json` (omarchy.dk, omarchy.jp, zh.omarchy.org, …)
- omarchy.cn, which serves the zh-CN build from Aliyun OSS for mainland China

Point at the site's own pages and files with root-relative paths, such as
`/assets/images/...`, `/images/...` or `/manual/...`, never
`https://omarchy.org/...`. An absolute URL makes every other domain fetch from
omarchy.org, which omarchy.cn in particular must not do.

Write an absolute omarchy.org URL only when it has to reach the English
edition, such as a canonical URL or a link into the English manual.
`plugins.omarchy.org`, `donate.omarchy.org` and `iso.omarchy.org` are separate
sites. Linking to them is fine, but an image or script the site shows belongs
in this repository and loads from a relative path.
