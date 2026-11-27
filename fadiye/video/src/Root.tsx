import React from "react";
import { Composition, Folder } from "remotion";
import "./fonts";
import { fontsLoaded } from "./fonts";
import { Presentation, PRESENTATION_DURATION } from "./Presentation";
import { Ouverture } from "./scenes/Ouverture";
import { Manifeste } from "./scenes/Manifeste";
import { Revelation, REVELATION_DURATION } from "./scenes/Revelation";
import { Details, DETAILS_DURATION } from "./scenes/Details";
import { FicheTechnique, FICHE_DURATION } from "./scenes/FicheTechnique";
import { Signature, SIGNATURE_DURATION } from "./scenes/Signature";

const V = { width: 1080, height: 1920, fps: 30 } as const;
const waitFonts = async () => {
  await fontsLoaded;
  return {};
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FadiyePresentation"
        component={Presentation}
        durationInFrames={PRESENTATION_DURATION}
        calculateMetadata={waitFonts}
        {...V}
      />
      <Folder name="Scenes">
        <Composition id="Ouverture" component={Ouverture} durationInFrames={150} calculateMetadata={waitFonts} {...V} />
        <Composition id="Manifeste" component={Manifeste} durationInFrames={288} calculateMetadata={waitFonts} {...V} />
        <Composition id="Revelation" component={Revelation} durationInFrames={REVELATION_DURATION} calculateMetadata={waitFonts} {...V} />
        <Composition id="Details" component={Details} durationInFrames={DETAILS_DURATION} calculateMetadata={waitFonts} {...V} />
        <Composition id="FicheTechnique" component={FicheTechnique} durationInFrames={FICHE_DURATION} calculateMetadata={waitFonts} {...V} />
        <Composition id="Signature" component={Signature} durationInFrames={SIGNATURE_DURATION} calculateMetadata={waitFonts} {...V} />
      </Folder>
    </>
  );
};
