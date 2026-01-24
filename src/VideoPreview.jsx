import { Player } from "@remotion/player";
import { GeminiTodoVideo } from "../remotion/GeminiTodoVideo";

export const VideoPreview = ({ onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          right: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ color: "#E0E0E0", fontSize: 24, fontWeight: 600, margin: 0 }}>
          Video Preview
        </h1>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#E0E0E0",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ← Back to App
        </button>
      </div>

      {/* Player */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Player
          component={GeminiTodoVideo}
          durationInFrames={450}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={30}
          style={{
            width: 960,
            height: 540,
          }}
          controls
          autoPlay
          loop
        />
      </div>

      {/* Info */}
      <p style={{ color: "#A0A0A0", marginTop: 24, fontSize: 14 }}>
        15 seconds • 1920×1080 • 30fps
      </p>
    </div>
  );
};
