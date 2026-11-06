import { PluginInstanceInternal } from "@lib/addons/plugins/types";

interface CorePlugin {
    default: PluginInstanceInternal;
    preenabled: boolean;
}

// Called from @lib/plugins
export const getCorePlugins = (): Record<string, CorePlugin> => ({
    "bunny.quickinstall": require("./quickinstall"),
    "bunny.badges": require("./badges"),
    "endercord.hidden-channels": require("./hiddenChannels"),
    "endercord.edit-history": require("./editHistory"),
    "endercord.hide-gift-button": require("./hideGiftButton"),
    "endercord.device-spoofer": { ...require("./deviceSpoofer"), preenabled: false }
});

/**
 * @internal
 */
export function defineCorePlugin(instance: PluginInstanceInternal): PluginInstanceInternal {
    // @ts-expect-error
    instance[Symbol.for("bunny.core.plugin")] = true;
    return instance;
}
