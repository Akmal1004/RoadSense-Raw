import { Platform, TurboModuleRegistry } from "react-native";

export function isMapLibreNativeAvailable(): boolean {
  if (Platform.OS === "web") {
    return false;
  }
  try {
    return (
      typeof TurboModuleRegistry !== "undefined" &&
      TurboModuleRegistry !== null &&
      typeof TurboModuleRegistry.get === "function" &&
      TurboModuleRegistry.get("MLRNCameraModule") != null
    );
  } catch {
    return false;
  }
}
