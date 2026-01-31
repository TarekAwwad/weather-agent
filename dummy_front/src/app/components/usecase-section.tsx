import { HiringAgent } from "@/app/components/hiring-agent";
import { CustomerSupportContent } from "@/app/components/customer-support";

interface UsecaseSectionProps {
  usecaseType: "agent" | "auditor";
  demoContext: "customer-support" | "hiring-agent";
}

export function UsecaseSection({
  usecaseType,
  demoContext,
}: UsecaseSectionProps) {
  // Render the appropriate component based on demoContext
  if (demoContext === "hiring-agent") {
    return <HiringAgent usecaseType={usecaseType} />;
  }

  // Continue with CustomerSupport content
  return <CustomerSupportContent usecaseType={usecaseType} />;
}
