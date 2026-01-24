import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const AIFeaturesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Feature cards stagger
  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      title: "Smart Breakdown",
      description: "AI splits complex tasks into actionable subtasks",
      color: "#6366F1",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          <path d="M19 3v4" />
          <path d="M21 5h-4" />
        </svg>
      ),
      title: "Task Refinement",
      description: "Rewrites tasks to be clearer and more specific",
      color: "#EAB308",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      title: "Auto-Prioritize",
      description: "Intelligently orders tasks by urgency & importance",
      color: "#8B5CF6",
    },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Section title */}
      <div
        style={{
          position: "absolute",
          top: 120,
          opacity: titleOpacity,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
        </div>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: "#E0E0E0",
            margin: 0,
          }}
        >
          Powered by Gemini AI
        </h2>
      </div>

      {/* Feature cards */}
      <div
        style={{
          display: "flex",
          gap: 32,
          marginTop: 80,
        }}
      >
        {features.map((feature, index) => {
          const delay = index * 15;

          const cardOpacity = interpolate(
            frame,
            [20 + delay, 35 + delay],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const cardScale = spring({
            frame: Math.max(0, frame - 20 - delay),
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          const cardY = interpolate(
            frame,
            [20 + delay, 35 + delay],
            [40, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Shimmer effect for icons
          const shimmer = interpolate(
            frame,
            [40 + delay, 60 + delay, 80 + delay, 100 + delay],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={index}
              style={{
                opacity: cardOpacity,
                transform: `scale(${cardScale}) translateY(${cardY}px)`,
              }}
            >
              <FeatureCard
                {...feature}
                shimmer={shimmer}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const FeatureCard = ({ icon, title, description, color, shimmer }) => {
  return (
    <div
      style={{
        width: 320,
        padding: 32,
        background: "#16181A",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: color,
          marginBottom: 24,
          boxShadow: `0 0 ${30 * shimmer}px ${color}60`,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "#E0E0E0",
          margin: 0,
          marginBottom: 12,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 16,
          color: "#A0A0A0",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
    </div>
  );
};
