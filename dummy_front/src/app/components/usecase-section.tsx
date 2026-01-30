import { HiringAgent } from "@/app/components/hiring-agent";
import { HiringAgentChat } from "@/app/components/hiring-agent-chat";
import { CustomerSupportContent } from "@/app/components/customer-support";

interface UsecaseSectionProps {
  usecaseType: "agent" | "auditor";
  demoContext: "customer-support" | "hiring-agent";
  useMastraIntegration?: boolean; // Enable Mastra API integration
  mastraAgentId?: string; // Mastra agent ID for hiring agent
}

export function UsecaseSection({
  usecaseType,
  demoContext,
  useMastraIntegration = true, // Default to using Mastra integration
  mastraAgentId = "hiringAgent",
}: UsecaseSectionProps) {
  // Render the appropriate component based on demoContext
  if (demoContext === "hiring-agent") {
    // Use Mastra-integrated chat for agent mode, regular form for auditor
    if (useMastraIntegration && usecaseType === "agent") {
      return <HiringAgentChat usecaseType={usecaseType} agentId={mastraAgentId} />;
    }
    return <HiringAgent usecaseType={usecaseType} />;
  }

  // Continue with CustomerSupport content
  return <CustomerSupportContent usecaseType={usecaseType} />;
}
