import { useEffect, useRef } from "react";
import { Animated, Image, Platform, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/hooks/useTheme";

const mapPatternImage = require("../../assets/map_pattern.png");

// ─── Mobile Scene Renderer ────────────────────────────────────────────────────

function MobileMapBackground() {
  const { isDark } = useTheme();
  const lanes = [0.10, 0.28, 0.50, 0.72, 0.90];

  const laneAnims = useRef(lanes.map(() => new Animated.Value(0))).current;
  const radarAnim = useRef(new Animated.Value(0)).current;
  const orbAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = laneAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200 + i * 100,
            useNativeDriver: true
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      )
    );
    animations.forEach((a) => a.start());

    Animated.loop(
      Animated.timing(radarAnim, {
        toValue: 1,
        duration: 7000,
        useNativeDriver: true
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(orbAnim, { toValue: 0, duration: 2500, useNativeDriver: true })
      ])
    ).start();

    return () => animations.forEach((a) => a.stop());
  }, []);

  const spin = radarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

  const orbOpacity = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? [0.40, 0.75] : [0.50, 0.85]
  });

  const primaryColor = isDark ? "#00F0FF" : "#0052FF";
  const bg = isDark ? "#050814" : "#EEF3FF";

  return (
    <View style={[styles.mobileContainer, { backgroundColor: bg }]} pointerEvents="none">
      <Image
        source={mapPatternImage}
        style={[
          styles.fullScreenMapImage,
          { opacity: isDark ? 0.35 : 0.80 }
        ]}
        resizeMode="cover"
      />

      <Animated.View
        style={[
          styles.mobileOrbPrimary,
          {
            backgroundColor: isDark ? "rgba(0, 240, 255, 0.45)" : "rgba(0, 82, 255, 0.45)",
            opacity: orbOpacity
          }
        ]}
      />
      <Animated.View
        style={[
          styles.mobileOrbSecondary,
          {
            backgroundColor: isDark ? "rgba(157, 78, 221, 0.45)" : "rgba(112, 0, 255, 0.40)",
            opacity: orbOpacity
          }
        ]}
      />

      <View style={styles.radarCenterWrap}>
        <Animated.View
          style={[
            styles.radarBeamCircle,
            {
              borderColor: isDark ? "rgba(0, 240, 255, 0.40)" : "rgba(0, 82, 255, 0.40)",
              transform: [{ rotate: spin }]
            }
          ]}
        >
          <View style={[styles.radarScanLine, { backgroundColor: primaryColor }]} />
        </Animated.View>
      </View>

      {laneAnims.map((anim, i) => {
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, 900]
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.08, 0.85, 1],
          outputRange: [0, 0.95, 0.9, 0]
        });
        const scaleX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 1.8]
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.laneStripe,
              {
                left: `${lanes[i] * 100}%` as any,
                transform: [{ translateY }, { scaleX }],
                opacity,
                backgroundColor: isDark ? "rgba(0, 240, 255, 0.95)" : "rgba(0, 82, 255, 0.95)",
                shadowColor: primaryColor
              }
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── Web Scene Renderer with Metro Asset Image ────────────────────────────────

function WebMapBackground() {
  const { theme, isDark } = useTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const bg = isDark ? "#050814" : "#EEF3FF";
    document.documentElement.style.setProperty("background-color", bg, "important");
    document.body.style.setProperty("background-color", bg, "important");
  }, [theme.background, isDark]);

  const css = isDark ? darkMapCSS : vibrantLightCSS;

  return (
    <View style={styles.webContainer} pointerEvents="none">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="rs-vector-map-bg">
        {/* React Native Image Component resolving Metro asset bundle */}
        <Image
          source={mapPatternImage}
          style={[
            styles.fullScreenMapImage,
            { opacity: isDark ? 0.38 : 0.85 }
          ]}
          resizeMode="cover"
        />

        {/* Glassmorphic Atmosphere Tint */}
        <div className={isDark ? "rs-glass-tint-dark" : "rs-glass-tint-light"} />

        {/* Holographic Radar & Telemetry Overlays */}
        {isDark ? (
          <div className="rs-telemetry-layer">
            <div className="rs-orb-cyan" />
            <div className="rs-orb-violet" />
            <div className="rs-orb-magenta" />
            <div className="rs-radar-wrap">
              <div className="rs-radar-ring" />
              <div className="rs-radar-sweep" />
            </div>
            <div className="rs-particle rs-p1" />
            <div className="rs-particle rs-p2" />
            <div className="rs-particle rs-p3" />
            <div className="rs-particle rs-p4" />
            <div className="rs-particle rs-p5" />
            <div className="rs-particle rs-p6" />
            <div className="rs-grid" />
          </div>
        ) : (
          <div className="rs-telemetry-layer">
            <div className="rs-light-orb-blue" />
            <div className="rs-light-orb-purple" />
            <div className="rs-light-orb-magenta" />
            <div className="rs-light-radar-wrap">
              <div className="rs-light-radar-ring" />
              <div className="rs-light-radar-sweep" />
            </div>
            <div className="rs-light-particle rs-light-p1" />
            <div className="rs-light-particle rs-light-p2" />
            <div className="rs-light-particle rs-light-p3" />
            <div className="rs-light-particle rs-light-p4" />
            <div className="rs-light-grid" />
          </div>
        )}
      </div>
    </View>
  );
}

// ─── Cyber Neon Vector Map CSS (Dark Mode) ────────────────────────────────────

const darkMapCSS = `
  html, body, #root {
    background-color: #050814 !important;
    min-height: 100%;
  }
  #root > div {
    background-color: transparent !important;
  }

  @keyframes orbFloat1 {
    0%   { transform: translate(0px, 0px) scale(1); opacity: 0.70; }
    33%  { transform: translate(140px, -90px) scale(1.35); opacity: 0.90; }
    66%  { transform: translate(-100px, 110px) scale(0.85); opacity: 0.50; }
    100% { transform: translate(0px, 0px) scale(1); opacity: 0.70; }
  }
  @keyframes orbFloat2 {
    0%   { transform: translate(0px, 0px) scale(1); opacity: 0.65; }
    33%  { transform: translate(-150px, 100px) scale(1.38); opacity: 0.85; }
    66%  { transform: translate(110px, -110px) scale(0.80); opacity: 0.45; }
    100% { transform: translate(0px, 0px) scale(1); opacity: 0.65; }
  }
  @keyframes radarSpin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes particleDrift {
    0%   { transform: translateY(100vh) scale(0.8); opacity: 0; }
    15%  { opacity: 0.95; }
    85%  { opacity: 0.75; }
    100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
  }
  @keyframes gridPulse {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 0.48; }
  }

  .rs-vector-map-bg {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    z-index: 0;
    pointer-events: none;
    background: #050814;
  }

  .rs-glass-tint-dark {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(5, 8, 20, 0.45) 0%, rgba(5, 8, 20, 0.78) 75%);
    backdrop-filter: blur(3px);
  }

  .rs-telemetry-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .rs-orb-cyan {
    position: absolute;
    top: -18%; left: -10%;
    width: 780px; height: 780px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 240, 255, 0.50) 0%, rgba(0, 180, 255, 0.22) 50%, transparent 72%);
    filter: blur(75px);
    animation: orbFloat1 15s infinite ease-in-out;
  }
  .rs-orb-violet {
    position: absolute;
    bottom: -20%; right: -8%;
    width: 840px; height: 840px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(157, 78, 221, 0.50) 0%, rgba(112, 0, 255, 0.22) 50%, transparent 70%);
    filter: blur(80px);
    animation: orbFloat2 19s infinite ease-in-out;
  }
  .rs-orb-magenta {
    position: absolute;
    top: 25%; right: 15%;
    width: 540px; height: 540px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 0, 127, 0.40) 0%, transparent 68%);
    filter: blur(65px);
    animation: orbFloat1 22s infinite ease-in-out;
  }

  .rs-radar-wrap {
    position: absolute;
    top: 40%; left: 50%;
    transform: translate(-50%, -50%);
    width: 620px; height: 620px;
    border-radius: 50%;
    pointer-events: none;
  }
  .rs-radar-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px dashed rgba(0, 240, 255, 0.45);
  }
  .rs-radar-sweep {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(from 0deg, rgba(0, 240, 255, 0.35) 0deg, rgba(157, 78, 221, 0.20) 60deg, transparent 180deg);
    animation: radarSpin 9s linear infinite;
  }

  .rs-particle { position: absolute; border-radius: 50%; animation: particleDrift linear infinite; }
  .rs-p1  { left: 8%;  width: 4px; height: 4px; background: #00F0FF; box-shadow: 0 0 10px #00F0FF; animation-duration: 8s;  animation-delay: 0s; }
  .rs-p2  { left: 17%; width: 4px; height: 4px; background: #9D4EDD; box-shadow: 0 0 10px #9D4EDD; animation-duration: 11s; animation-delay: 2s; }
  .rs-p3  { left: 25%; width: 5px; height: 5px; background: #FF007F; box-shadow: 0 0 12px #FF007F; animation-duration: 7s;  animation-delay: 4s; }
  .rs-p4  { left: 75%; width: 4px; height: 4px; background: #00FF88; box-shadow: 0 0 10px #00FF88; animation-duration: 9s;  animation-delay: 1s; }
  .rs-p5  { left: 83%; width: 4px; height: 4px; background: #00F0FF; box-shadow: 0 0 10px #00F0FF; animation-duration: 13s; animation-delay: 5s; }
  .rs-p6  { left: 91%; width: 5px; height: 5px; background: #FFB703; box-shadow: 0 0 12px #FFB703; animation-duration: 6s;  animation-delay: 3s; }

  .rs-grid {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(0, 240, 255, 0.20) 1.8px, transparent 1.8px);
    background-size: 38px 38px;
    animation: gridPulse 8s infinite ease-in-out;
  }
`;

// ─── Aurora Prism Vector Map CSS (Light Mode) ─────────────────────────────────

const vibrantLightCSS = `
  html, body, #root {
    background-color: #EEF3FF !important;
    min-height: 100%;
  }
  #root > div {
    background-color: transparent !important;
  }

  @keyframes lightOrbFloat1 {
    0%   { transform: translate(0px, 0px) scale(1); opacity: 0.70; }
    33%  { transform: translate(130px, -80px) scale(1.30); opacity: 0.90; }
    66%  { transform: translate(-90px, 100px) scale(0.85); opacity: 0.50; }
    100% { transform: translate(0px, 0px) scale(1); opacity: 0.70; }
  }
  @keyframes lightOrbFloat2 {
    0%   { transform: translate(0px, 0px) scale(1); opacity: 0.65; }
    33%  { transform: translate(-130px, 90px) scale(1.32); opacity: 0.85; }
    66%  { transform: translate(100px, -100px) scale(0.82); opacity: 0.45; }
    100% { transform: translate(0px, 0px) scale(1); opacity: 0.65; }
  }
  @keyframes lightRadarSpin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes lightParticleDrift {
    0%   { transform: translateY(100vh) scale(0.8); opacity: 0; }
    15%  { opacity: 0.95; }
    85%  { opacity: 0.75; }
    100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
  }
  @keyframes lightGridPulse {
    0%, 100% { opacity: 0.32; }
    50%       { opacity: 0.58; }
  }

  .rs-vector-map-bg {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    z-index: 0;
    pointer-events: none;
    background: #EEF3FF;
  }

  .rs-glass-tint-light {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(238, 243, 255, 0.35) 0%, rgba(238, 243, 255, 0.68) 75%);
    backdrop-filter: blur(2px);
  }

  .rs-telemetry-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .rs-light-orb-blue {
    position: absolute;
    top: -18%; left: -10%;
    width: 780px; height: 780px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 82, 255, 0.52) 0%, rgba(0, 82, 255, 0.22) 50%, transparent 72%);
    filter: blur(70px);
    animation: lightOrbFloat1 17s infinite ease-in-out;
  }
  .rs-light-orb-purple {
    position: absolute;
    bottom: -20%; right: -8%;
    width: 820px; height: 820px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(112, 0, 255, 0.48) 0%, rgba(112, 0, 255, 0.18) 50%, transparent 70%);
    filter: blur(75px);
    animation: lightOrbFloat2 21s infinite ease-in-out;
  }
  .rs-light-orb-magenta {
    position: absolute;
    top: 25%; right: 15%;
    width: 540px; height: 540px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 0, 127, 0.40) 0%, transparent 68%);
    filter: blur(60px);
    animation: lightOrbFloat1 24s infinite ease-in-out;
  }

  .rs-light-radar-wrap {
    position: absolute;
    top: 40%; left: 50%;
    transform: translate(-50%, -50%);
    width: 620px; height: 620px;
    border-radius: 50%;
    pointer-events: none;
  }
  .rs-light-radar-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px dashed rgba(0, 82, 255, 0.45);
  }
  .rs-light-radar-sweep {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(from 0deg, rgba(0, 82, 255, 0.35) 0deg, rgba(112, 0, 255, 0.20) 60deg, transparent 180deg);
    animation: lightRadarSpin 9s linear infinite;
  }

  .rs-light-particle { position: absolute; border-radius: 50%; animation: lightParticleDrift linear infinite; }
  .rs-light-p1 { left: 8%;  width: 4px; height: 4px; background: #0052FF; box-shadow: 0 0 10px #0052FF; animation-duration: 8s;  animation-delay: 0s; }
  .rs-light-p2 { left: 17%; width: 4px; height: 4px; background: #7000FF; box-shadow: 0 0 10px #7000FF; animation-duration: 11s; animation-delay: 2s; }
  .rs-light-p3 { left: 25%; width: 5px; height: 5px; background: #FF007F; box-shadow: 0 0 12px #FF007F; animation-duration: 7s;  animation-delay: 4s; }
  .rs-light-p4 { left: 75%; width: 4px; height: 4px; background: #00C853; box-shadow: 0 0 10px #00C853; animation-duration: 9s;  animation-delay: 1s; }

  .rs-light-grid {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(0, 82, 255, 0.24) 2px, transparent 2px);
    background-size: 38px 38px;
    animation: lightGridPulse 8s infinite ease-in-out;
  }
`;

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AnimatedBackground() {
  if (Platform.OS === "web") {
    return <WebMapBackground />;
  }
  return <MobileMapBackground />;
}

const styles = StyleSheet.create({
  webContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0
  },
  mobileContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden"
  },
  fullScreenMapImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    zIndex: 0
  },
  mobileOrbPrimary: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 380,
    height: 380,
    borderRadius: 190
  },
  mobileOrbSecondary: {
    position: "absolute",
    bottom: -120,
    right: -80,
    width: 400,
    height: 400,
    borderRadius: 200
  },
  radarCenterWrap: {
    alignItems: "center",
    justifyContent: "center",
    ...StyleSheet.absoluteFillObject
  },
  radarBeamCircle: {
    alignItems: "center",
    borderRadius: 180,
    borderWidth: 1.5,
    height: 360,
    justifyContent: "center",
    width: 360
  },
  radarScanLine: {
    height: 170,
    position: "absolute",
    top: 10,
    width: 2.5
  },
  laneStripe: {
    position: "absolute",
    width: 3.5,
    height: 76,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8
  }
});
