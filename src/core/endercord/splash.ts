import { FluxDispatcher } from "@metro/common";

const EVENTS = ["CACHE_LOADED", "CONNECTION_OPEN"];

// The loader covers Discord's startup screen with EnderCord's ring. It goes away once Discord has something to show:
// its cached data or a connection, or after a few seconds when there is neither, like on the login screen.
export function hideSplashWhenReady() {
    let timer: ReturnType<typeof setTimeout>;

    const hide = () => {
        clearTimeout(timer);
        EVENTS.forEach(e => FluxDispatcher.unsubscribe(e, hide));
        // Calls the loader's bridge, which listens on this native method
        const reader = globalThis.__turboModuleProxy?.("FileReaderModule") ?? window.nativeModuleProxy.FileReaderModule;
        setTimeout(() => reader?.readAsDataURL({ revenge: { method: "endercord.splash.hide", args: [] } })?.catch?.(() => { }), 300);
    };

    EVENTS.forEach(e => FluxDispatcher.subscribe(e, hide));
    timer = setTimeout(hide, 6000);
}
