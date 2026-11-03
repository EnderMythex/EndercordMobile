<p align="center">
  <img src=".github/assets/banner.png" alt="EnderCord Mobile" width="100%">
</p>

<p align="center">
  <a href="https://github.com/EnderMythex/EndercordMobile/releases/latest"><img src="https://img.shields.io/github/v/release/EnderMythex/EndercordMobile?style=flat-square&label=release&labelColor=000&color=1c1c1e" alt="Latest release"></a>
  <a href="https://github.com/EnderMythex/EndercordManager/releases/latest"><img src="https://img.shields.io/github/v/release/EnderMythex/EndercordManager?style=flat-square&label=manager&labelColor=000&color=1c1c1e" alt="Manager release"></a>
  <img src="https://img.shields.io/badge/platform-Android-1c1c1e?style=flat-square&labelColor=000" alt="Android">
</p>

<p align="center">
  <a href="https://github.com/EnderMythex/Endercord"><b>EnderCord</b></a> for Discord Android: the black theme with the ring,<br>
  plugins, themes and fonts, on the real and up to date Discord app.
</p>

<br>

## Install

Download the [**EnderCord Manager**](https://github.com/EnderMythex/EndercordManager/releases/latest), open it and tap **Install**. It downloads Discord, adds EnderCord to it and installs it next to the official app. No root needed.

With root and an Xposed framework (LSPosed, Vector), you can instead install [`EndercordXposed.apk`](https://github.com/EnderMythex/EndercordMobile/releases/latest/download/EndercordXposed.apk) as a module, scoped to Discord.

EnderCord then keeps itself up to date: each time Discord starts, it fetches the latest version.

<br>

## Features

- **EnderCord theme.** Turned on at first launch: deep black panels with the EnderCord ring glowing behind your messages. You can switch it off or pick another theme in **Settings › EnderCord › Themes**.
- **Plugins.** Install plugins from a link in **Settings › EnderCord › Plugins**. Vendetta, Bunny and Revenge plugins work.
- **Themes and fonts.** Any Vendetta or Revenge theme, and custom fonts.
- **Safe mode.** If a plugin breaks Discord, start in safe mode and turn it off.

Plugins made for EnderCord on PC don't work here: the Android app is built differently, so mobile plugins are written separately.

<br>

## How it fits together

| Part | Where | What it does |
| --- | --- | --- |
| Bundle | `src/` | The JavaScript that runs inside Discord: settings pages, plugins, themes, fonts. Released as `endercord.min.js`. |
| Loader | `xposed/` | Loads the bundle when Discord starts, downloads its updates and gives it access to files and native theming. Released as `EndercordXposed.apk`. |
| Manager | [EndercordManager](https://github.com/EnderMythex/EndercordManager) | Patches Discord with the loader on phones without root, and installs it. |
| Theme | `themes/` | The EnderCord theme and its background. |

Every push to `main` builds the bundle and the loader on GitHub Actions and publishes them as a new release.

<br>

## Build

You need [Bun](https://bun.sh), and for the loader JDK 25 and the Android SDK.

```sh
bun install
bun run build --build-minify   # dist/endercord.js and dist/endercord.min.js
```

To try a local build on your phone, run `bun run serve`, then in Discord enable **Settings › EnderCord › Developer**, turn on **Load from custom URL** and point it at `http://<your computer's IP>:4040/endercord.js`.

```sh
cd xposed
./gradlew :app:assembleRelease
```

<br>

## Credits

EnderCord Mobile is a fork of [Revenge](https://github.com/revenge-mod/revenge-bundle) and [RevengeXposed](https://github.com/revenge-mod/revenge-xposed), which continue [Bunny](https://github.com/pyoncord/Bunny) and [Vendetta](https://github.com/vendetta-mod). Thanks to all of their contributors.

The bundle is under the [BSD 3-Clause license](LICENSE), and the loader under the [GPL 3.0](xposed/LICENSE).

## Disclaimer

Discord is a trademark of Discord Inc. EnderCord is not affiliated with or endorsed by Discord Inc. or Revenge. Client modifications are against Discord's Terms of Service; use it at your own risk.
