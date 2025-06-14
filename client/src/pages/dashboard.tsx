import { useState } from "react";
import { LoadDashboard } from "@/components/load-dashboard";
import { LoadDashboardWithAssignments } from "@/components/load-dashboard-with-assignments";
import { FleetManagement } from "@/components/fleet-management";
import { StatusOverview } from "@/components/status-overview";
import AIProcessing from "@/components/ai-processing";
import CallSimulator from "@/components/call-simulator";
import { TwilioSetup } from "@/components/twilio-setup";
import { NotificationPanel } from "@/components/notification-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Settings } from "lucide-react";

export default function Dashboard() {
  const [systemStatus] = useState("active");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Truck className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Expedite Transport</h1>
                  <p className="text-xs text-slate-500">AI-Powered Load Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <div className={`w-2 h-2 rounded-full ${systemStatus === 'active' ? 'bg-success' : 'bg-error'}`}></div>
                <span>System {systemStatus === 'active' ? 'Active' : 'Inactive'}</span>
              </div>
              <button className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Overview */}
        <StatusOverview />

        {/* Load Dashboard - positioned right after status tiles */}
        <div className="mt-8">
          <Tabs defaultValue="loads" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="loads">Load Requests</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="ai">AI Processing</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="simulator">Simulator</TabsTrigger>
        </TabsList>

        <TabsContent value="loads">
          <LoadDashboard />
        </TabsContent>

        <TabsContent value="assignments">
          <LoadDashboardWithAssignments />
        </TabsContent>

        <TabsContent value="fleet">
          <FleetManagement />
        </TabsContent>

        <TabsContent value="ai">
          <AIProcessing />
        </TabsContent>

        <TabsContent value="setup">
          <TwilioSetup />
        </TabsContent>

        <TabsContent value="simulator">
          <CallSimulator />
        </TabsContent>
      </Tabs>
        </div>

        {/* AI Processing and Notification Panel - side by side layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Processing - takes up half the screen */}
          <div className="lg:col-span-1">
            <AIProcessing />
          </div>

          {/* Notifications - on the right side */}
          <div className="lg:col-span-1">
            <NotificationPanel />
          </div>
        </div>
      </div>
    </div>
  );
}