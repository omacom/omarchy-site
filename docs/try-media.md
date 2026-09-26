# Try Omarchy media

The /try page uses real host captures.

- `public/images/try/mac.webp`: Mac README screenshot at https://github.com/user-attachments/assets/1368a8f5-5099-43e4-8d3b-3d7d7fba0326, linked from https://github.com/omacom/try-omarchy.
- `public/images/try/windows.mp4`: recorded September 26, 2026 on the maintainer's AMD Windows 11 test laptop, with Try Omarchy running through WHPX and GPU rendering. The 29-second clip shows the terminal, tiled apps, workspaces, and Catppuccin, Everforest, and Tokyo Night themes. It retains the native Windows title bar; the unrelated taskbar is outside the capture. Idle pauses were trimmed without speeding up the footage. Playback is on request; switching platform tabs unmounts the video and stops playback.
- `public/images/try/windows.webp`: a deliberate frame from the opening terminal view, with no open menu or notification.

The Mac screenshot was retrieved September 25, 2026 and compressed to WebP without changing its content. Its app version is unknown. The Windows recording uses the maintainer's development installation, not a fresh stable-release acceptance run. These captures illustrate the experience and do not establish release or feature-parity acceptance.

Replace the Mac screenshot with a maintainer-supplied recording when available. Keep the screenshot as the poster, require playback on request, and do not present Windows footage as a Mac demonstration.

Download links use each project's latest stable release asset, with setup and release notes alongside them. Recheck requirements and captures when either app changes. Both platforms are listed explicitly; browser detection does not hide a download.

The page uses the site's shared layout, theme tokens, hero animation, accessible tabs, and translation extraction. New English strings fall back to English until the translation pipeline fills them.

The standalone site is generated from this same TryPage component. Its exporter adapts origin, metadata, and navigation only. Keep page text and media changes here so both deployments stay aligned.
