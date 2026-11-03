import { findAssetId } from "@lib/api/assets";
import { after } from "@lib/api/patcher";
import { deleteJsxCreate, onJsxCreate } from "@lib/api/react/jsx";
import { findByName, findByStoreName } from "@metro";

import { defineCorePlugin } from "..";

const PLATFORMS: Record<string, [label: string, icons: string[]]> = {
    desktop: ["Desktop", ["ScreenIcon"]],
    mobile: ["Mobile", ["MobilePhoneIcon"]],
    web: ["Web", ["GlobeEarthIcon", "ScreenIcon"]],
    embedded: ["Console", ["GameControllerIcon", "ScreenIcon"]]
};

const badgeProps: Record<string, Record<string, unknown>> = {};
let unpatch: (() => unknown) | undefined;

function onBadge(_: unknown, ret: JSX.Element) {
    const props = badgeProps[ret.props.id];
    if (props) Object.assign(ret.props, props);
    return ret;
}

export default defineCorePlugin({
    manifest: {
        id: "endercord.platform-indicators",
        spec: 3,
        type: "plugin",
        version: "1.0.0",
        main: "",
        display: {
            name: "Platform Indicators",
            description: "Shows on someone's profile whether they are on desktop, mobile, web or a console.",
            authors: [{ name: "EnderMythex" }]
        }
    },
    start() {
        const PresenceStore = findByStoreName("PresenceStore");
        const useBadges = findByName("useBadges", false);

        onJsxCreate("RenderedBadge", onBadge);

        unpatch = after("default", useBadges, ([user], badges) => {
            if (!user) return;
            const statuses = PresenceStore.getState().clientStatuses?.[user.userId] ?? {};

            for (const platform of Object.keys(statuses)) {
                if (!(platform in PLATFORMS)) continue;
                const [label, icons] = PLATFORMS[platform];
                const id = `ec-platform-${user.userId}-${platform}`;

                badgeProps[id] = {
                    id: `ec-platform-${platform}`,
                    label: `${label} (${statuses[platform]})`,
                    source: icons.map(findAssetId).find(Boolean)
                };
                badges.push({ id, description: label, icon: "_" });
            }
        });
    },
    stop() {
        unpatch?.();
        deleteJsxCreate("RenderedBadge", onBadge);
    }
});
