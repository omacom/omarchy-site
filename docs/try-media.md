# Try Omarchy media

The /try pages use real host captures.

- `public/images/try/mac.webp`: Mac README screenshot at https://github.com/user-attachments/assets/1368a8f5-5099-43e4-8d3b-3d7d7fba0326, linked from https://github.com/omacom/try-omarchy.
- `public/images/try/windows.webp`: a frame of a recording made September 26, 2026 on the maintainer's AMD Windows 11 test laptop, with Try Omarchy running through WHPX and GPU rendering. It shows the maximized app with the Windows taskbar in view, btop beside omarchy.org in Chromium. Third-party taskbar pins and desktop icons were hidden for the capture.
- `public/images/try/linux.webp`: captured September 29, 2026 on a clean Ubuntu 24.04 GNOME test VM running Try Omarchy for Linux preview 3, installed from its `.flatpakref` through Software. It shows the app in a window over the stock Ubuntu desktop, with fastfetch and btop in Omarchy's Tokyo Night theme. The orange indicator in the top bar is GNOME's remote desktop permission, which the app uses for clipboard sharing.

The Mac screenshot was retrieved September 25, 2026 and compressed to WebP without changing its content. Its app version is unknown. The Windows capture uses the maintainer's development installation, not a fresh stable-release acceptance run. These captures illustrate the experience and do not establish release or feature-parity acceptance.

All three previews are stills, so the page loads no video. Replace a still with a maintainer-supplied recording when one is available, keeping the still as its poster and starting playback only on request. Do not present one platform's footage as another's.

Mac and Windows download links use each project's latest stable release asset, with setup and release notes alongside them. Linux links to the project's `.flatpakref` at https://tryomarchy.com/linux.flatpakref, which adds the app's signed Flatpak repository, so the repository address and key stay with the project. `/try/linux/` covers Software, Ubuntu and terminal installs. Recheck requirements and captures when any app changes. All platforms are listed explicitly; browser detection does not hide a download.

The pages use the site's shared layout, theme tokens, hero animation, accessible tabs, and translation extraction. New English strings fall back to English until the translation pipeline fills them.

The standalone site is generated from these same components. Its exporter adapts origin, metadata, and navigation only. Keep page text and media changes here so both deployments stay aligned.
