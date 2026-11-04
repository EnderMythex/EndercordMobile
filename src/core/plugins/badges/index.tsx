import { after } from "@lib/api/patcher";
import { onJsxCreate } from "@lib/api/react/jsx";
import { ENDERCORD_BADGES_URL } from "@lib/utils/constants";
import { findByName } from "@metro";
import { useEffect, useState } from "react";

import { defineCorePlugin } from "..";

interface BunnyBadge {
    label: string;
    url: string;
}

const useBadgesModule = findByName("useBadges", false);

// EnderCord's own badges, one list per user ID, fetched once per launch
let badgesRequest: Promise<Record<string, BunnyBadge[]>> | undefined;
const getBadges = () => badgesRequest ??= fetch(ENDERCORD_BADGES_URL, { cache: "no-store" }).then(r => r.json());

export default defineCorePlugin({
    manifest: {
        id: "bunny.badges",
        name: "Badges",
        version: "1.0.0",
        description: "Adds badges to user's profile",
        authors: [{ name: "pylixonly" }]
    },
    start() {
        const propHolder = {} as Record<string, any>;
        const badgeCache = {} as Record<string, BunnyBadge[]>;

        onJsxCreate("RenderedBadge", (_, ret) => {
            if (ret.props.id.match(/bunny-\d+-\d+/)) {
                Object.assign(ret.props, propHolder[ret.props.id]);
            }
        });

        after("default", useBadgesModule, ([user], r) => {
            const [badges, setBadges] = useState<BunnyBadge[]>(user ? badgeCache[user.userId] ??= [] : []);

            useEffect(() => {
                if (user) {
                    getBadges()
                        .then(all => setBadges(badgeCache[user.userId] = all[user.userId] ?? []))
                        .catch(() => { });
                }
            }, [user]);

            if (user) {
                badges.forEach((badges, i) => {
                    propHolder[`bunny-${user.userId}-${i}`] = {
                        source: { uri: badges.url },
                        id: `bunny-${i}`,
                        label: badges.label
                    };

                    r.push({
                        id: `bunny-${user.userId}-${i}`,
                        description: badges.label,
                        icon: "_",
                    });
                });
            }
        });
    }
});
