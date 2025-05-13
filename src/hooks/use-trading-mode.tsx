
import { useState } from "react";
import { useToast } from "./use-toast";

type TradingMode = "auto" | "manual";

interface UseTradingModeProps {
  symbol: string;
  onModeChange?: (mode: TradingMode) => void;
}

export function useTradingMode({ symbol, onModeChange }: UseTradingModeProps) {
  const [mode, setMode] = useState<TradingMode>("manual");
  const { toast } = useToast();
  
  const toggleTradingMode = () => {
    const newMode = mode === "auto" ? "manual" : "auto";
    setMode(newMode);
    
    toast({
      title: `${newMode === "auto" ? "Automatic" : "Manual"} Trading Mode`,
      description: newMode === "auto"
        ? `AI will now automatically trade ${symbol} based on signals`
        : `Now in manual mode. Current positions are maintained.`,
    });
    
    if (onModeChange) {
      onModeChange(newMode);
    }
    
    return newMode;
  };
  
  return {
    mode,
    setMode,
    toggleTradingMode,
    isAutoMode: mode === "auto",
    isManualMode: mode === "manual",
  };
}
