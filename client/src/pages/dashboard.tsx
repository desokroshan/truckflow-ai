import { useState } from "react";
import StatusOverview from "@/components/status-overview";
import CallSimulator from "@/components/call-simulator";
import AIProcessing from "@/components/ai-processing";
import LoadDashboard from "@/components/load-dashboard";
import NotificationPanel from "@/components/notification-panel";
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
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Truck className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">TruckFlow AI</h1>
                  <p className="text-xs text-slate-500">Automated Load Management</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <CallSimulator />
            <AIProcessing />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <NotificationPanel />
          </div>
        </div>

        {/* Load Dashboard */}
        <div className="mt-8">
          <LoadDashboard />
        </div>
      </div>
    </div>
  );
}
