import { createContext, useContext } from "react";
import { useT } from "./anim";

// Donne aux composants d'une scène l'heure « globale » de la vidéo (pour se caler sur la musique).
export const SceneStart = createContext(0);
export const useG = () => useT() + useContext(SceneStart);
