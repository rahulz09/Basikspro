import { createContext, useContext } from "react";

export const AnalyserContext = createContext<AnalyserNode | null>(null);
export const useAnalyser = () => useContext(AnalyserContext);
