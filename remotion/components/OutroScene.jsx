import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scale up animation
  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  // Glow animation
  const glow = interpolate(frame, [0, 30, 60], [0, 1, 0.8], {
    extrapolateRight: "clamp",
  });

  // Text fade in
  const textOpacity = interpolate(frame, [15, 30], [0, 1], {
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
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(99, 102, 241, ${0.25 * glow}) 0%, transparent 60%)`,
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `scale(${scale})`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: `0 0 ${50 * glow}px rgba(99, 102, 241, ${0.5 * glow})`,
            marginBottom: 32,
          }}
        >
          <svg
            width="50"
            height="50"
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
        <h1
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#E0E0E0",
            margin: 0,
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          Gemini Todo
        </h1>

        {/* CTA */}
        <div
          style={{
            opacity: textOpacity,
          }}
        >
          <p
            style={{
              fontSize: 28,
              color: "#A0A0A0",
              margin: 0,
              marginBottom: 32,
            }}
          >
            Get more done with AI
          </p>

          {/* Button */}
          <div
            style={{
              padding: "16px 48px",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              borderRadius: 12,
              fontSize: 22,
              fontWeight: 600,
              color: "white",
              boxShadow: `0 4px 20px rgba(99, 102, 241, ${0.4 * glow})`,
            }}
          >
            Try it now
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
