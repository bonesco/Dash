import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const NaturalLanguageScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fullText = "Call John tomorrow at 2pm urgent";

  // Typing animation - one character every 2 frames
  const charsToShow = Math.min(Math.floor(frame / 2), fullText.length);
  const displayedText = fullText.slice(0, charsToShow);

  // Cursor blink
  const cursorVisible = frame % 30 < 20;

  // Tags appear after typing is done
  const tagsDelay = fullText.length * 2 + 10;

  const tag1Opacity = interpolate(frame, [tagsDelay, tagsDelay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tag2Opacity = interpolate(frame, [tagsDelay + 8, tagsDelay + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tag3Opacity = interpolate(frame, [tagsDelay + 16, tagsDelay + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tag1Y = spring({
    frame: Math.max(0, frame - tagsDelay),
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  const tag2Y = spring({
    frame: Math.max(0, frame - tagsDelay - 8),
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  const tag3Y = spring({
    frame: Math.max(0, frame - tagsDelay - 16),
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  // Title animation
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

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
        }}
      >
        <h2
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: "#6366F1",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Natural Language Input
        </h2>
      </div>

      {/* Input container */}
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          background: "#16181A",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)",
          padding: 32,
          marginTop: 40,
        }}
      >
        {/* Input field */}
        <div
          style={{
            background: "#0D0E10",
            borderRadius: 12,
            padding: "20px 24px",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: "#E0E0E0",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {displayedText}
            {cursorVisible && charsToShow < fullText.length && (
              <span style={{ color: "#6366F1" }}>|</span>
            )}
          </span>
        </div>

        {/* Parsed tags */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {/* Tomorrow tag */}
          <div
            style={{
              opacity: tag1Opacity,
              transform: `translateY(${(1 - tag1Y) * 20}px)`,
            }}
          >
            <Tag
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
              label="Tomorrow"
              color="#F97316"
            />
          </div>

          {/* 2pm tag */}
          <div
            style={{
              opacity: tag2Opacity,
              transform: `translateY(${(1 - tag2Y) * 20}px)`,
            }}
          >
            <Tag
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              label="2:00 PM"
              color="#38BDF8"
            />
          </div>

          {/* Urgent tag */}
          <div
            style={{
              opacity: tag3Opacity,
              transform: `translateY(${(1 - tag3Y) * 20}px)`,
            }}
          >
            <Tag
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
              label="Urgent"
              color="#EF4444"
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Tag = ({ icon, label, color }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        background: `${color}15`,
        border: `1px solid ${color}40`,
        borderRadius: 8,
        color: color,
        fontSize: 18,
        fontWeight: 500,
      }}
    >
      {icon}
      {label}
    </div>
  );
};
