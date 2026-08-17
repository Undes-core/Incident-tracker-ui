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
        <IncidentTable />
      </TabPanel>
      <TabPanel tab="performance" activeTab={tab} />
      <TabPanel tab="knowledge" activeTab={tab} />
      <IncidentDetailDrawer />
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
