// PATCH: Fix broken localStorage polyfill in Next.js 15+ / Node environment
// Some dependency or the runtime itself is presenting a broken localStorage
if (typeof window === 'undefined') {
    try {
        const mockStorage = {
            getItem: (key) => null,
            setItem: (key, value) => {},
            removeItem: (key) => {},
            clear: () => {},
            key: (n) => null,
            length: 0
        };
        // Use Object.defineProperty to overwrite if it's non-writable
        Object.defineProperty(global, 'localStorage', {
            value: mockStorage,
            writable: true,
            configurable: true
        });
        console.log("Global Polyfill: Forcefully mocked global.localStorage");
    } catch (e) {
        console.error("Global Polyfill: Failed to patch localStorage:", e);
    }
}
