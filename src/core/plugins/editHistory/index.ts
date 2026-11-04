import { intercept } from "@lib/api/flux";
import { findByStoreName } from "@metro";
import { UserStore } from "@metro/common/stores";

import { defineCorePlugin } from "..";

// Per message: what it really says now, and what it said before each edit. Kept until Discord restarts.
const realContent = new Map<string, string>();
const history = new Map<string, string[]>();
let unintercept: (() => void) | undefined;

const withHistory = (content: string, edits: string[]) =>
    content + edits.map(old => "\n" + old.split("\n").map(line => `-# ✏️ ${line}`).join("\n")).join("");

export default defineCorePlugin({
    manifest: {
        id: "endercord.edit-history",
        spec: 3,
        type: "plugin",
        version: "1.0.0",
        main: "",
        display: {
            name: "Edit History",
            description: "Shows what a message said before it was edited, in small text under it, until Discord restarts.",
            authors: [{ name: "EnderMythex" }]
        }
    },
    start() {
        const MessageStore = findByStoreName("MessageStore");

        unintercept = intercept(payload => {
            const message = payload.type === "MESSAGE_UPDATE" && payload.message;
            // Updates without content only add embeds, and your own messages would get the history in their edit box
            if (!message?.id || typeof message.content !== "string") return;
            if (message.author?.id === UserStore.getCurrentUser()?.id) return;

            const stored = MessageStore.getMessage(message.channel_id, message.id);
            if (!stored) return;

            const previous = realContent.get(message.id) ?? stored.content;
            const edits = history.get(message.id) ?? [];
            if (previous && previous !== message.content) edits.push(previous);
            realContent.set(message.id, message.content);
            if (!edits.length) return;

            history.set(message.id, edits);
            return { message: { ...message, content: withHistory(message.content, edits) } };
        });
    },
    stop() {
        unintercept?.();
    }
});
