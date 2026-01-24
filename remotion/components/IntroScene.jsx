import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scale animation with spring
  const logoScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 1,
    },
  });

  // Glow pulse animation
  const glowIntensity = interpolate(
    frame,
    [0, 30, 60, 90],
    [0, 1, 0.7, 1],
    { extrapolateRight: "clamp" }
  );

  // Title fade in
  const titleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [20, 40], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle fade in
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Animated glow background */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(99, 102, 241, ${0.3 * glowIntensity}) 0%, transparent 70%)`,
          filter: "blur(60px)",
          transform: `scale(${1 + glowIntensity * 0.2})`,
        }}
      />

      {/* Logo container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `scale(${logoScale})`,
        }}
      >
        {/* Checkmark icon */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: `0 0 ${60 * glowIntensity}px rgba(99, 102, 241, ${0.5 * glowIntensity})`,
            marginBottom: 40,
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#E0E0E0",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Gemini Todo
          </h1>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitleOpacity,
            marginTop: 16,
          }}
        >
          <p
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "#A0A0A0",
              margin: 0,
            }}
          >
            AI-Powered Task Management
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
