import { useState } from "react";
import { UsecaseSection } from "@/app/components/usecase-section";
import { ToolSection } from "@/app/components/tool-section";

export default function App() {
  const [usecaseType, setUsecaseType] = useState<"agent" | "auditor">("agent");
  const [demoContext, setDemoContext] = useState<"customer-support" | "hiring-agent">("customer-support");

  return (
    <div className="h-screen flex">
      {/* Left Side - Usecase Section */}
      <div className="w-[58%] h-full border-r border-gray-200 overflow-hidden">
        {/* Use demoContext as key to force remount when switching */}
        <UsecaseSection
          key={demoContext}
          usecaseType={usecaseType}
          demoContext={demoContext}
        />
      </div>

      {/* Right Side - Tool Section */}
      <div className="w-[42%] h-full overflow-hidden">
        <ToolSection 
          key={demoContext}
          usecaseType={usecaseType} 
          setUsecaseType={setUsecaseType}
          demoContext={demoContext}
          setDemoContext={setDemoContext}
        />
      </div>
    </div>
  );
}