import { Composition } from "remotion";
import { GeminiTodoVideo } from "./GeminiTodoVideo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GeminiTodoVideo"
        component={GeminiTodoVideo}
        durationInFrames={450} // 15 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
