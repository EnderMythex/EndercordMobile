import { VdPluginManager } from "@core/vendetta/plugins";
import { awaitStorage } from "@core/vendetta/storage";
import { settings } from "@lib/api/settings";
import { logger } from "@lib/utils/logger";

// Community plugins EnderCord installs once. They keep updating from their authors, and stay removed if the user removes them.
const DEFAULT_PLUGINS = [
    "https://martinz64.github.io/vendetta-plugins/PlatformIndicators/",
    "https://meqativ.github.io/dumsane/NoDelete/",
    "https://tralwdwd.github.io/plugins/JumpToTop/",
    "https://plugins.obamabot.me/vendetta-plugins/globalBadges/",
    "https://lvwmwm.github.io/vendettian-plugins/permissionviewer/"
];

// Earlier defaults that broke on current Discord. Hidden Channels is now built in, with a fix.
const REMOVED_PLUGINS = [
    "https://lioncat6.github.io/revenge-plugins/hidden-channels/",
    "https://angelix1.github.io/MP/angel/radialstatus/"
];

export async function installDefaultPlugins() {
    await awaitStorage(settings);

    for (const url of REMOVED_PLUGINS) {
        if (!settings.enderDefaultPlugins?.includes(url) || !(url in VdPluginManager.plugins)) continue;
        await VdPluginManager.removePlugin(url).catch(e => logger.error(`Failed to remove ${url}`, e));
    }

    for (const url of DEFAULT_PLUGINS) {
        const done = settings.enderDefaultPlugins ?? [];
        if (done.includes(url)) continue;

        try {
            if (!(url in VdPluginManager.plugins)) await VdPluginManager.installPlugin(url);
            settings.enderDefaultPlugins = [...done, url];
        } catch (e) {
            // Not marked as done, so it is tried again on the next launch
            logger.error(`Failed to install ${url}`, e);
        }
    }
}
