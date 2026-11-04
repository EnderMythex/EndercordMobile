// Based on Hidden Channels by lioncat6 (https://github.com/lioncat6/revenge-plugins, CC0), itself reworked from cloudburst's script.
import { showConfirmationAlert } from "@core/vendetta/alerts";
import { findAssetId } from "@lib/api/assets";
import { after, instead } from "@lib/api/patcher";
import { findByName, findByProps, findByStoreName } from "@metro";
import { constants } from "@metro/common";
import { Text } from "@metro/common/components";
import { Image, View } from "react-native";

import { defineCorePlugin } from "..";

let unpatches: (() => unknown)[] = [];

const date = (ms: number) => new Date(ms).toLocaleDateString();

export default defineCorePlugin({
    manifest: {
        id: "endercord.hidden-channels",
        spec: 3,
        type: "plugin",
        version: "1.0.0",
        main: "",
        display: {
            name: "Hidden Channels",
            description: "Shows the channels you can't see with a lock, and their topic and dates when you open one.",
            authors: [{ name: "lioncat6" }, { name: "EnderMythex" }]
        }
    },
    start() {
        const Permissions = findByProps("getChannelPermissions", "can");
        const { ChannelTypes } = findByProps("ChannelTypes");
        const ChannelStore = findByStoreName("ChannelStore");
        const GuildChannelStore = findByStoreName("GuildChannelStore");
        const SelectedGuildStore = findByStoreName("SelectedGuildStore");
        const Snowflake = findByProps("extractTimestamp");
        const VIEW_CHANNEL = constants.Permissions.VIEW_CHANNEL;
        const skipped = [ChannelTypes.DM, ChannelTypes.GROUP_DM, ChannelTypes.GUILD_CATEGORY];

        // Discord is told every channel is viewable so it lists them. realCheck asks for the real answer.
        const isHidden = (channel: any) => {
            if (!channel || skipped.includes(channel.type)) return false;
            channel.realCheck = true;
            const hidden = !Permissions.can(VIEW_CHANNEL, channel);
            delete channel.realCheck;
            return hidden;
        };

        unpatches.push(after("can", Permissions, ([permission, channel], res) =>
            permission === VIEW_CHANNEL && !channel?.realCheck ? true : res
        ));

        // The first channel of a server you can really see, for when Discord picks a hidden one itself
        const firstVisible = (guildId: string) =>
            GuildChannelStore.getChannels(guildId)?.SELECTABLE?.map((c: any) => c.channel).find((c: any) => !isHidden(c))?.id;

        const Router = findByProps("transitionToGuild");
        for (const key of Object.keys(Router)) {
            if (typeof Router[key] !== "function") continue;

            unpatches.push(instead(key, Router, (args, orig) => {
                const path = args[0];
                const channel = typeof path === "string" && ChannelStore.getChannel(path.match(/(\d+)$/)?.[1]);
                if (!channel || !isHidden(channel)) return orig(...args);

                // Tapping a server opens the channel Discord remembers or lists first, which can now be a hidden one.
                // Only ask when the hidden channel was opened from inside its own server.
                if (channel.guild_id !== SelectedGuildStore.getGuildId()) {
                    const visible = firstVisible(channel.guild_id);
                    return visible ? orig(path.replace(/\d+$/, visible), ...args.slice(1)) : orig(...args);
                }

                showConfirmationAlert({
                    title: "This channel is hidden.",
                    content: <View style={{ gap: 8 }}>
                        <Text variant="text-md/normal">Topic: {channel.topic || "No topic."}</Text>
                        <Text variant="text-md/normal">Created: {date(Snowflake.extractTimestamp(channel.id))}</Text>
                        <Text variant="text-md/normal">Last message: {channel.lastMessageId ? date(Snowflake.extractTimestamp(channel.lastMessageId)) : "No messages."}</Text>
                    </View>,
                    confirmText: "View Anyway",
                    cancelText: "Cancel",
                    onConfirm: () => orig(...args)
                });
                return {};
            }));
        }

        const ChannelInfo = findByName("ChannelInfo", false);
        const lock = findAssetId("ic_lock") ?? findAssetId("LockIcon");
        if (ChannelInfo && lock) {
            unpatches.push(after("default", ChannelInfo, ([{ channel }], ret) => isHidden(channel)
                ? <><Image source={lock} style={{ width: 20, height: 20, marginRight: 4 }} />{ret}</>
                : ret
            ));
        }
    },
    stop() {
        unpatches.forEach(u => u());
        unpatches = [];
    }
});
