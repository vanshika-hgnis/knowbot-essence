// components/LoadingScreen.tsx
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen = ({ message }: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
      <p className="text-lg text-white">{message}</p>
    </div>
  );
};
