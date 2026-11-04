import { VdPluginManager } from "@core/vendetta/plugins";
import { useProxy } from "@core/vendetta/storage";
import { findAssetId } from "@lib/api/assets";
import { showToast } from "@lib/ui/toasts";
import { Button, TableRow, TableRowGroup } from "@metro/common/components";
import { useState } from "react";
import { View } from "react-native";

// Community plugins marked as working on https://plugins-list.pages.dev, installable in one tap
const RECOMMENDED = [
    { name: "Plugin Browser", description: "Browse and install every proxied plugin.", url: "https://revenge.nexpid.xyz/plugin-browser/" },
    { name: "Cloud Sync", description: "Backs up your plugins, themes and fonts online.", url: "https://revenge.nexpid.xyz/cloud-sync/" },
    { name: "Clean URLs", description: "Removes tracking from links you send and receive.", url: "https://revenge.nexpid.xyz/clean-urls/" },
    { name: "NoTrack", description: "Turns off Discord's tracking.", url: "https://maisymoe.github.io/strife/NoTrack/" },
    { name: "Message Preview", description: "Preview a message before sending it.", url: "https://revenge.nexpid.xyz/message-preview/" },
    { name: "Char Counter", description: "A character counter above the chat box.", url: "https://revenge.nexpid.xyz/char-counter/" },
    { name: "Quick Delete", description: "Deletes messages without asking first.", url: "https://purple-eyez.github.io/RevengePlugins/QuickDelete/" },
    { name: "NoAutoReplyMention", description: "Doesn't ping people when you reply to them.", url: "https://vd-plugins.github.io/proxy/amsyarasyiq.github.io/letup/NoAutoReplyMention/" },
    { name: "Gestures+", description: "Double tap a message to reply or edit it.", url: "https://rksv.kmmiio99o.dev/GeasturesPlus/" },
    { name: "NoCompression", description: "Uploads files without compressing them.", url: "https://martinz64.github.io/vendetta-plugins/NoCompression/" },
    { name: "Dislate Lite", description: "Translates messages.", url: "https://rico040.github.io/bunny-plugins/dislate/" },
    { name: "Keyword Tracker", description: "Notifies you when a keyword is mentioned.", url: "https://il1ll.github.io/RevengePlugins/KeywordTracker/" },
    { name: "Bluetooth Audio Fix", description: "Keeps Bluetooth headphones out of hands free mode in calls.", url: "https://raw.githubusercontent.com/NarwhalKid/revenge-plugin/refs/heads/master/audiofix/" },
    { name: "Use System Emoji", description: "Your phone's emoji instead of Discord's.", url: "https://revenge.nexpid.xyz/use-system-emoji/" },
    { name: "UserBG", description: "Custom profile banners from the community.", url: "https://rico040.github.io/bunny-plugins/userbg/" },
    { name: "UserPFP", description: "Custom avatars from the community.", url: "https://revenge.nexpid.xyz/userpfp/" }
];

export default function RecommendedPlugins() {
    useProxy(VdPluginManager.plugins);
    const [installing, setInstalling] = useState<string | null>(null);

    const available = RECOMMENDED.filter(p => !(p.url in VdPluginManager.plugins));
    if (!available.length) return null;

    async function install(url: string, name: string) {
        setInstalling(url);
        try {
            await VdPluginManager.installPlugin(url);
            showToast(`Installed ${name}`, findAssetId("DownloadIcon"));
        } catch (e) {
            showToast(`Couldn't install ${name}`, findAssetId("XSmallIcon"));
            console.error(`Failed to install ${url}`, e);
        }
        setInstalling(null);
    }

    return <View style={{ paddingHorizontal: 12, paddingTop: 16 }}>
        <TableRowGroup title="Recommended">
            {available.map(p => <TableRow
                key={p.url}
                label={p.name}
                subLabel={p.description}
                trailing={<Button
                    size="sm"
                    variant="secondary"
                    text={installing === p.url ? "Installing" : "Install"}
                    disabled={installing !== null}
                    onPress={() => install(p.url, p.name)}
                />}
            />)}
        </TableRowGroup>
    </View>;
}
