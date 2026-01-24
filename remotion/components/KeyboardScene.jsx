import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const KeyboardScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const shortcuts = [
    { keys: ["↑", "↓"], action: "Navigate tasks" },
    { keys: ["Space"], action: "Toggle complete" },
    { keys: ["Enter"], action: "Open details" },
    { keys: ["⌘", "K"], action: "Quick search" },
    { keys: ["Delete"], action: "Archive task" },
    { keys: ["Esc"], action: "Close modal" },
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
          gap: 12,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <path d="M6 8h.001" />
          <path d="M10 8h.001" />
          <path d="M14 8h.001" />
          <path d="M18 8h.001" />
          <path d="M8 12h.001" />
          <path d="M12 12h.001" />
          <path d="M16 12h.001" />
          <path d="M7 16h10" />
        </svg>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: "#6366F1",
            margin: 0,
          }}
        >
          Keyboard-First Design
        </h2>
      </div>

      {/* Shortcuts grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
          marginTop: 60,
          maxWidth: 1100,
        }}
      >
        {shortcuts.map((shortcut, index) => {
          const delay = index * 8;

          const itemOpacity = interpolate(
            frame,
            [15 + delay, 25 + delay],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const itemX = interpolate(
            frame,
            [15 + delay, 25 + delay],
            [-30, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const keyPress = interpolate(
            frame,
            [35 + delay, 40 + delay, 45 + delay],
            [0, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={index}
              style={{
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
              }}
            >
              <ShortcutItem
                keys={shortcut.keys}
                action={shortcut.action}
                keyPress={keyPress}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const ShortcutItem = ({ keys, action, keyPress }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 24px",
        background: "#16181A",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Keys */}
      <div style={{ display: "flex", gap: 6 }}>
        {keys.map((key, index) => (
          <div
            key={index}
            style={{
              minWidth: 44,
              height: 44,
              padding: "0 12px",
              background: `rgba(99, 102, 241, ${0.1 + keyPress * 0.3})`,
              border: `1px solid rgba(99, 102, 241, ${0.3 + keyPress * 0.4})`,
              borderRadius: 8,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#E0E0E0",
              fontSize: 18,
              fontWeight: 600,
              fontFamily: "JetBrains Mono, monospace",
              transform: `translateY(${keyPress * 2}px)`,
              boxShadow: keyPress > 0.5
                ? "0 2px 8px rgba(99, 102, 241, 0.3)"
                : "none",
            }}
          >
            {key}
          </div>
        ))}
      </div>

      {/* Action */}
      <span
        style={{
          fontSize: 18,
          color: "#A0A0A0",
          fontWeight: 500,
        }}
      >
        {action}
      </span>
    </div>
  );
};
