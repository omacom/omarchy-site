# Try Omarchy media

The /try page uses real host captures.

- `public/images/try/mac.webp`: Mac README screenshot at https://github.com/user-attachments/assets/1368a8f5-5099-43e4-8d3b-3d7d7fba0326, linked from https://github.com/omacom/try-omarchy.
- `public/images/try/windows.mp4`: https://tryomarchy.com/assets/try-omarchy-hero.mp4, the existing Windows recording. Playback is on request; switching platform tabs unmounts the video and stops playback.
- `public/images/try/windows.webp`: https://tryomarchy.com/assets/poster-hero.jpg, the existing Windows demo poster.

Retrieved 2026-09-25 and compressed to WebP without changing the content. The app versions in the captures are unknown; these are illustrations of the experience, not evidence of current-release acceptance testing.

Replace the Mac screenshot with a maintainer-supplied recording when available. Keep the screenshot as the poster, require playback on request, and do not present Windows footage as a Mac demonstration.

Download links use each project's latest stable release asset, with setup and release notes alongside them. Recheck requirements and captures when either app changes. Both platforms are listed explicitly; browser detection does not hide a download.

The page uses the site's shared layout, theme tokens, hero animation, accessible tabs, and translation extraction. New English strings fall back to English until the translation pipeline fills them.

The standalone site is generated from this same TryPage component. Its exporter adapts origin, metadata, and navigation only. Keep page text and media changes here so both deployments stay aligned.
