import { intercept } from "@lib/api/flux";
import { findByStoreName } from "@metro";
import { UserStore } from "@metro/common/stores";

import { defineCorePlugin } from "..";

let unintercept: (() => void) | undefined;

export default defineCorePlugin({
    manifest: {
        id: "endercord.message-logger",
        spec: 3,
        type: "plugin",
        version: "1.0.0",
        main: "",
        display: {
            name: "Message Logger",
            description: "Keeps deleted messages in the chat, marked as deleted. Your own deletions still go through.",
            authors: [{ name: "EnderMythex" }]
        }
    },
    start() {
        const MessageStore = findByStoreName("MessageStore");

        // Turns the deletion into Discord's own "failed edit" notice, which leaves the message in place and shows a red line under it
        unintercept = intercept(payload => {
            if (payload.type !== "MESSAGE_DELETE") return;

            const message = MessageStore.getMessage(payload.channelId, payload.id);
            if (!message || message.author?.id === UserStore.getCurrentUser()?.id) return;

            return {
                type: "MESSAGE_EDIT_FAILED_AUTOMOD",
                messageData: { type: 1, message: { channelId: payload.channelId, messageId: payload.id } },
                errorResponseBody: { code: 200000, message: "This message was deleted." }
            };
        });
    },
    stop() {
        unintercept?.();
    }
});
