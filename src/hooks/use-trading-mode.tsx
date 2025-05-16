
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

type TradingMode = "auto" | "manual";

interface UseTradingModeProps {
  symbol?: string;
  onModeChange?: (mode: TradingMode) => void;
}

export function useTradingMode(props?: UseTradingModeProps) {
  const [mode, setMode] = useState<TradingMode>("manual");
  const { toast } = useToast();
  const symbol = props?.symbol || 'NIFTY';
  
  const toggleTradingMode = () => {
    const newMode = mode === "auto" ? "manual" : "auto";
    setMode(newMode);
    
    toast({
      title: `${newMode === "auto" ? "Automatic" : "Manual"} Trading Mode`,
      description: newMode === "auto"
        ? `AI will now automatically trade ${symbol} based on signals`
        : `Now in manual mode. Current positions are maintained.`,
    });
    
    if (props?.onModeChange) {
      props.onModeChange(newMode);
    }
    
    return newMode;
  };
  
  return {
    mode,
    setMode,
    toggleTradingMode,
    isAutoMode: mode === "auto",
    isManualMode: mode === "manual",
    // Add these properties to match the Dashboard usage
    isAutomatedTrading: mode === "auto",
    toggleAutomatedTrading: toggleTradingMode
  };
}
