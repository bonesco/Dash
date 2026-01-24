import { AbsoluteFill, Sequence } from "remotion";
import { IntroScene } from "./components/IntroScene";
import { NaturalLanguageScene } from "./components/NaturalLanguageScene";
import { AIFeaturesScene } from "./components/AIFeaturesScene";
import { KeyboardScene } from "./components/KeyboardScene";
import { OutroScene } from "./components/OutroScene";

export const GeminiTodoVideo = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050505",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Subtle grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Intro: 0-90 frames (3 seconds) */}
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>

      {/* Natural Language: 90-180 frames (3 seconds) */}
      <Sequence from={90} durationInFrames={90}>
        <NaturalLanguageScene />
      </Sequence>

      {/* AI Features: 180-300 frames (4 seconds) */}
      <Sequence from={180} durationInFrames={120}>
        <AIFeaturesScene />
      </Sequence>

      {/* Keyboard Shortcuts: 300-390 frames (3 seconds) */}
      <Sequence from={300} durationInFrames={90}>
        <KeyboardScene />
      </Sequence>

      {/* Outro: 390-450 frames (2 seconds) */}
      <Sequence from={390} durationInFrames={60}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
