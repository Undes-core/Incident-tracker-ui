import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./state/queryClient";
import { OperatorProvider } from "./state/OperatorContext";
import { useUrlState } from "./state/useUrlState";
import { useAlertStrip } from "./api/dashboard/alertStrip";
import { DashboardHeader } from "./components/layout/DashboardHeader";
import { AlertStrip } from "./components/layout/AlertStrip";
import { TabBar } from "./components/layout/TabBar";
import { TabPanel } from "./components/layout/TabPanel";
import { KpiStripNow } from "./components/kpi/KpiStrip.now";
import { IncidentTable } from "./components/incidents/IncidentTable";
import { IncidentDetailDrawer } from "./components/incidents/IncidentDetailDrawer";
import { ApprovalQueue } from "./components/approvals/ApprovalQueue";
import { CrossTabToast } from "./components/shared/CrossTabToast";
import { KpiStripPerformance } from "./components/kpi/KpiStrip.performance";
import { AutomationFunnelPanel } from "./components/charts/AutomationFunnelPanel";
import { ExecutionOutcomeDonutPanel } from "./components/charts/ExecutionOutcomeDonutPanel";
import { VolumeChartPanel } from "./components/charts/VolumeChartPanel";
import { PriorityBreakdownPanel } from "./components/charts/PriorityBreakdownPanel";
import { CategoryBreakdownPanel } from "./components/charts/CategoryBreakdownPanel";
import { ServiceBreakdownPanel } from "./components/charts/ServiceBreakdownPanel";
import { KpiStripKnowledge } from "./components/kpi/KpiStrip.knowledge";
import { CoverageGapsChartPanel } from "./components/charts/CoverageGapsChartPanel";
import { DocumentsDrivingResolutionsPanel } from "./components/charts/DocumentsDrivingResolutionsPanel";
import { DocumentationCandidates } from "./components/charts/DocumentationCandidates";

function Dashboard() {
  const { tab } = useUrlState();
  const { data: alertStrip } = useAlertStrip();

  return (
    <>
      <DashboardHeader />
      <AlertStrip />
      <TabBar pendingApprovalCount={alertStrip?.awaitingApproval ?? 0} />
      <TabPanel tab="now" activeTab={tab}>
        <KpiStripNow />
        <ApprovalQueue />
        <IncidentTable />
      </TabPanel>
      <TabPanel tab="performance" activeTab={tab}>
        <KpiStripPerformance />
        <AutomationFunnelPanel />
        <ExecutionOutcomeDonutPanel />
        <VolumeChartPanel />
        <PriorityBreakdownPanel />
        <CategoryBreakdownPanel />
        <ServiceBreakdownPanel />
      </TabPanel>
      <TabPanel tab="knowledge" activeTab={tab}>
        <KpiStripKnowledge />
        <CoverageGapsChartPanel />
        <DocumentsDrivingResolutionsPanel />
        <DocumentationCandidates />
      </TabPanel>
      <IncidentDetailDrawer />
      <CrossTabToast />
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OperatorProvider>
        <Dashboard />
      </OperatorProvider>
    </QueryClientProvider>
  );
}
