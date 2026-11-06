import { before } from "@lib/api/patcher";
import { createFilterDefinition } from "@metro/factories";
import { findExports } from "@metro/finders";

import { defineCorePlugin } from "..";

const byTypeDisplayName = createFilterDefinition<[string]>(
    ([name], m) => m?.type?.displayName === name,
    ([name]) => `endercord.byTypeDisplayName(${name})`
);

let unpatches: (() => unknown)[] = [];

export default defineCorePlugin({
    manifest: {
        id: "endercord.hide-gift-button",
        spec: 3,
        type: "plugin",
        version: "1.0.0",
        main: "",
        display: {
            name: "Hide Gift Button",
            description: "Removes the Nitro gift button from the chat box.",
            authors: [{ name: "EnderMythex" }]
        }
    },
    start() {
        // The chat box's action row: ChatInputActions before Discord's redesign, ChatInputRightActions after it.
        // Both take a shouldShowGiftButton prop. Technique from PalmDevs' Better Chat Buttons.
        for (const name of ["ChatInputActions", "ChatInputRightActions"]) {
            const component = findExports(byTypeDisplayName(name));
            if (!component?.type) continue;

            unpatches.push(before("render", component.type, ([props]) => {
                props.shouldShowGiftButton = false;
            }));
        }
    },
    stop() {
        unpatches.forEach(u => u());
        unpatches = [];
    }
});
