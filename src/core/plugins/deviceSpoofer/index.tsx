import { createMMKVBackend, createStorage, useProxy, wrapSync } from "@core/vendetta/storage";
import { findAssetId } from "@lib/api/assets";
import { BundleUpdaterManager } from "@lib/api/native/modules";
import { after, before } from "@lib/api/patcher";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { Button, Stack, TableRadioGroup, TableRadioRow, TableRowIcon } from "@metro/common/components";
import { ScrollView } from "react-native";

import { defineCorePlugin } from "..";

// The browser and OS Discord reports when it connects decide which device icon others see next to you
const DEVICES = {
    desktop: { label: "Desktop", icons: ["ScreenIcon"], props: { browser: "Discord Client", os: "Windows" } },
    web: { label: "Web browser", icons: ["GlobeEarthIcon", "ScreenIcon"], props: { browser: "Chrome", os: "Windows" } },
    android: { label: "Android", icons: ["MobilePhoneIcon"], props: { browser: "Discord Android", os: "Android" } },
    ios: { label: "iPhone", icons: ["MobilePhoneIcon"], props: { browser: "Discord iOS", os: "iOS", device: "iPhone" } },
    xbox: { label: "Xbox", icons: ["XboxIcon", "GameControllerIcon", "ScreenIcon"], props: { browser: "Discord Embedded", os: "Xbox" } },
    playstation: { label: "PlayStation", icons: ["PlaystationIcon", "GameControllerIcon", "ScreenIcon"], props: { browser: "Discord Embedded", os: "Playstation" } },
    vr: { label: "VR headset", icons: ["VrHeadsetIcon", "ScreenIcon"], props: { browser: "Discord VR", os: "Android" } }
} as const;
type Device = keyof typeof DEVICES;

const storage = wrapSync(createStorage<{ device: Device; }>(createMMKVBackend("ENDERCORD_DEVICE_SPOOFER", { device: "desktop" })));
let unpatches: (() => unknown)[] = [];

const spoofed = () => DEVICES[storage.device]?.props ?? DEVICES.desktop.props;

function Settings() {
    useProxy(storage);

    return <ScrollView>
        <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={16}>
            <TableRadioGroup
                title="Appear as"
                defaultValue={storage.device}
                hasIcons={true}
                onChange={device => { storage.device = device as Device; }}
            >
                {Object.entries(DEVICES).map(([key, { label, icons }]) =>
                    <TableRadioRow key={key} icon={<TableRowIcon source={icons.map(findAssetId).find(Boolean)} />} label={label} value={key} />
                )}
            </TableRadioGroup>
            <Button text="Reload Discord to Apply" onPress={() => BundleUpdaterManager.reload()} />
        </Stack>
    </ScrollView>;
}

export default defineCorePlugin({
    manifest: {
        id: "endercord.device-spoofer",
        spec: 3,
        type: "plugin",
        version: "1.1.0",
        main: "",
        display: {
            name: "Device Spoofer",
            description: "Makes others see you on desktop, web, iPhone, Xbox, PlayStation or VR instead of Android. Reload Discord after changing it.",
            authors: [{ name: "EnderMythex" }]
        }
    },
    start() {
        // Rewrites the IDENTIFY frame (op 2) Discord sends when it connects to the gateway
        unpatches.push(before("send", WebSocket.prototype, args => {
            if (typeof args[0] !== "string" || !args[0].includes("\"op\":2")) return;
            try {
                const frame = JSON.parse(args[0]);
                if (frame.op !== 2 || !frame.d?.properties) return;
                Object.assign(frame.d.properties, spoofed());
                args[0] = JSON.stringify(frame);
            } catch (e) {
                logger.error("Device Spoofer couldn't rewrite the identify frame", e);
            }
        }));

        // Some builds read the device from here instead
        const superProperties = findByProps("getSuperProperties");
        if (superProperties) unpatches.push(after("getSuperProperties", superProperties, (_, ret) => ({ ...ret, ...spoofed() })));
    },
    stop() {
        unpatches.forEach(u => u());
        unpatches = [];
    },
    SettingsComponent: Settings
});
