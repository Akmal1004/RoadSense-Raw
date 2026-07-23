export type RoadSenseTheme = {
  name: "dark" | "light";
  background: string;
  surface: string;
  card: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
  muted: string;
  success: string;
  warning: string;
  danger: string;
  input: string;
  iconButton: string;
  chipBackground: string;
  chipBorder: string;
  tabBar: string;
  mapLegend: string;
  modalOverlay: string;
  mapStyle: "dark" | "light";
  gradientPrimary: [string, string, string];
};

// NeonDrive — Deep Space Navy + Electric Cyan + Violet + Neon Green
export const darkTheme: RoadSenseTheme = {
  name: "dark",
  background: "#070B18",
  surface: "rgba(13,18,40,0.90)",
  card: "rgba(11,16,38,0.82)",
  primary: "#00E5FF",
  secondary: "#7C3AED",
  accent: "#39FF14",
  text: "#E8F4FD",
  textSecondary: "#6B8CAE",
  border: "rgba(0,229,255,0.18)",
  muted: "#2D3A54",
  success: "#39FF14",
  warning: "#FF9500",
  danger: "#FF3B5C",
  input: "rgba(0,229,255,0.06)",
  iconButton: "rgba(0,229,255,0.10)",
  chipBackground: "rgba(0,229,255,0.10)",
  chipBorder: "rgba(0,229,255,0.28)",
  tabBar: "rgba(7,11,24,0.97)",
  mapLegend: "rgba(7,11,24,0.90)",
  modalOverlay: "rgba(7,11,24,0.85)",
  mapStyle: "dark",
  gradientPrimary: ["#00E5FF", "#7C3AED", "#39FF14"]
};
