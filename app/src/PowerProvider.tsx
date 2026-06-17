import type { ReactNode } from "react";

/**
 * Wrapper kept for parity with the Power Apps code-app template.
 * The data client (`getClient` from `@microsoft/power-apps/data`) binds to the
 * Power Apps runtime automatically when the app is hosted, so no explicit
 * initialization call is required here. Running locally just falls back to
 * sample data in the data layer.
 */
export default function PowerProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
