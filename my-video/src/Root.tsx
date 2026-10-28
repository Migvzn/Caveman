import { Composition } from "remotion";
import { Presentation } from "./Presentation";
import { FPS, TOTAL } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Presentation" component={Presentation} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    </>
  );
};
