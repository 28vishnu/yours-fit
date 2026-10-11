import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yoursfit.app",
  appName: "Smart Fit",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { backgroundColor: "#f7f7fb" }
};

export default config;
