// Demo mode is ONLY permitted in development builds.
// In production (import.meta.env.DEV === false), this is always false
// regardless of the VITE_DEMO_MODE env var.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true" && import.meta.env.DEV;
