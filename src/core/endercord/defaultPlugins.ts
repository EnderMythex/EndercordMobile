import { VdPluginManager } from "@core/vendetta/plugins";
import { awaitStorage } from "@core/vendetta/storage";
import { settings } from "@lib/api/settings";
import { logger } from "@lib/utils/logger";

// Community plugins EnderCord installs once. They keep updating from their authors, and stay removed if the user removes them.
const DEFAULT_PLUGINS = [
    "https://martinz64.github.io/vendetta-plugins/PlatformIndicators/",
    "https://meqativ.github.io/dumsane/NoDelete/",
    "https://lioncat6.github.io/revenge-plugins/hidden-channels/",
    "https://tralwdwd.github.io/plugins/JumpToTop/",
    "https://angelix1.github.io/MP/angel/radialstatus/",
    "https://plugins.obamabot.me/vendetta-plugins/globalBadges/"
];

export async function installDefaultPlugins() {
    await awaitStorage(settings);

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
