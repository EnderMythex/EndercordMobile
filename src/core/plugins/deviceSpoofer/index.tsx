import { createMMKVBackend, createStorage, useProxy, wrapSync } from "@core/vendetta/storage";
import { findAssetId } from "@lib/api/assets";
import { BundleUpdaterManager } from "@lib/api/native/modules";
import { after } from "@lib/api/patcher";
import { findByProps } from "@metro";
import { Button, Stack, TableRadioGroup, TableRadioRow, TableRowIcon } from "@metro/common/components";
import { ScrollView } from "react-native";

import { defineCorePlugin } from "..";

const DEVICES = {
    desktop: { label: "Desktop", icon: "ScreenIcon", props: { os: "Windows", browser: "Discord Client", device: "" } },
    web: { label: "Web browser", icon: "ScreenIcon", props: { os: "Windows", browser: "Chrome", device: "" } },
    ios: { label: "iPhone", icon: "MobilePhoneIcon", props: { os: "iOS", browser: "Discord iOS", device: "iPhone15,2" } }
} as const;
type Device = keyof typeof DEVICES;

const storage = wrapSync(createStorage<{ device: Device; }>(createMMKVBackend("ENDERCORD_DEVICE_SPOOFER", { device: "desktop" })));
let unpatch: (() => unknown) | undefined;

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
                {Object.entries(DEVICES).map(([key, { label, icon }]) =>
                    <TableRadioRow key={key} icon={<TableRowIcon source={findAssetId(icon)} />} label={label} value={key} />
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
        version: "1.0.0",
        main: "",
        display: {
            name: "Device Spoofer",
            description: "Makes others see you on desktop, web or iPhone instead of Android. Reload Discord after changing it.",
            authors: [{ name: "EnderMythex" }]
        }
    },
    start() {
        // The device Discord reports to the gateway when it connects, which decides the icon others see
        unpatch = after("getSuperProperties", findByProps("getSuperProperties"), (_, ret) => ({
            ...ret,
            ...DEVICES[storage.device]?.props
        }));
    },
    stop() {
        unpatch?.();
    },
    SettingsComponent: Settings
});
