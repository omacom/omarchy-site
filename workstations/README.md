# Workstation gallery

`index.html` is the page content source. `scripts/data/workstations-media.json`
records the gallery assets and Discord message links. Source links are retained
in metadata; the gallery has no visible captions. Clicking a photo opens the
lightbox, with left/right arrows to browse and Escape or the close button to exit.

The initial import read all 226 active and archived posts in the
[Discord showcase](https://discord.com/channels/1390012484194275541/1430672374159773707),
including their message histories. Nine posts had no available attachments.
Original downloads, signed CDN URLs, and message text are not committed.

## Automatic sync

Add an Actions repository secret named **DISCORD_BOT_TOKEN** in
[the repository settings](https://github.com/omacom/omarchy-site/settings/secrets/actions).
Use the Omabot bot token. The bot needs View Channel and Read Message History
in the showcase, plus Message Content Intent enabled in the Developer Portal.

Once merged into the default branch, **Sync Discord workstations** runs daily
at **05:43 UTC**. It can also be started from Actions → Sync Discord workstations
→ Run workflow. No personal GitHub token is needed: the workflow uses
`GITHUB_TOKEN` to commit changes and explicitly dispatch the existing deployment
workflow, following the repository's catalogue refresh pattern.

The sync reads active and archived forum posts, downloads only new image/video
attachments, checks exact duplicates, and reuses all existing optimized files.
It keeps already published workstations if their Discord messages disappear.
Permission failures, failed downloads, or failed builds stop the job before any
commit. Runs without changes do not commit or deploy.

`scripts/data/workstations-excluded.json` contains manually excluded discussion
attachments and automatically detected duplicates. Add an attachment ID here
to exclude it from future syncs, or a `file` path for a legacy gallery image.
The gallery is for photos of physical computers and workstation setups;
screenshots, screen recordings, and isolated peripherals or cases are excluded. New media is imported automatically; the sync
does not visually classify workstation photos versus unrelated discussion images.

## Local sync

With Python 3.13+, Node 24+, ffmpeg, and `npm ci` installed, set
`DISCORD_BOT_TOKEN` in your environment and run:

```sh
npm run sync:workstations
npm run port
```

To import previously downloaded media, provide a directory containing originals
named by attachment ID and a `manifest.json` array with `id`, `content_type`,
`title`, `post` (thread ID), and `message` (message ID):

```sh
node scripts/import-workstations.mjs /path/to/downloads
```

Only new attachments require originals. Repeated imports are idempotent.

Photos are auto-oriented, stripped of metadata, and encoded as WebP at up to
1920 pixels. Gallery previews are at most 640 pixels and load lazily. Full photos
load when opened. Videos use VP9/Opus WebM at up to 1280 pixels, with a WebP
poster and `preload="none"` so playback is requested by the visitor.

Use `npm run build:da` to refresh the Danish static preview; `npm run build`
updates the English build.
