import { ReactNode } from "react";

interface MobileFrameProps {
  children: ReactNode;
}

export const MobileFrame = ({ children }: MobileFrameProps) => {
  return (
    <div className="w-full h-screen h-[100dvh] flex flex-col overflow-hidden bg-background">
      {children}
    </div>
  );
};
