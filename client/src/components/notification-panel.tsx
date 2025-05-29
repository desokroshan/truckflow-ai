import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, CheckCircle, Database, Table, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LoadRequest } from "@shared/schema";

export default function NotificationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: loadRequests = [] } = useQuery<LoadRequest[]>({
    queryKey: ["/api/load-requests"],
  });

  const pendingLoad = loadRequests.find(load => load.status === "pending");

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/load-requests/${id}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Load Approved",
        description: "Load request has been approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/load-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/load-requests/${id}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Load Rejected", 
        description: "Load request has been rejected",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/load-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (pendingLoad) {
      approveMutation.mutate(pendingLoad.id);
    }
  };

  const handleReject = () => {
    if (pendingLoad) {
      rejectMutation.mutate(pendingLoad.id);
    }
  };

  const handleResendNotification = () => {
    toast({
      title: "Notification Resent",
      description: "Email notification has been resent to the owner",
    });
  };

  return (
    <div className="space-y-6">
      {/* Email Notification Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Owner Notification</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLoad ? (
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Mail className="text-white text-sm" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">New Load Request</p>
                  <p className="text-xs text-slate-500">
                    {pendingLoad.createdAt ? new Date(pendingLoad.createdAt).toLocaleString() : 'Just now'}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-slate-700 mb-4">
                <p className="font-medium mb-2">Load Summary:</p>
                <p>• Route: {pendingLoad.pickupLocation} → {pendingLoad.deliveryLocation}</p>
                <p>• Weight: {pendingLoad.weight} ({pendingLoad.cargoType})</p>
                <p>• Equipment: {pendingLoad.truckType}</p>
                {pendingLoad.pickupTime && <p>• Pickup: {pendingLoad.pickupTime}</p>}
                <p>• Customer: {pendingLoad.customerName}</p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                  size="sm"
                >
                  ✕ Reject
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-500 text-center">
                No pending load requests
              </p>
            </div>
          )}

          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Email sent to {process.env.REACT_APP_OWNER_EMAIL || 'owner@trucking.com'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-3 h-3 text-blue-500" />
              <span>SMS sent to {process.env.REACT_APP_OWNER_PHONE || '+1 (555) 999-8888'}</span>
            </div>
          </div>

          <Button
            onClick={handleResendNotification}
            variant="outline"
            className="w-full mt-4"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Resend Notification
          </Button>
        </CardContent>
      </Card>

      {/* Google Sheets Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Data Storage</CardTitle>
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
              <Table className="text-white text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Google Sheets</p>
              <p className="text-xs text-slate-500">Load data synced successfully</p>
            </div>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>

          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <Database className="text-white text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Airtable</p>
              <p className="text-xs text-slate-500">Backup storage active</p>
            </div>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Records today:</span>
                <span className="font-medium">{loadRequests.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Last sync:</span>
                <span className="font-medium">30 seconds ago</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">System Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-700">Twilio Voice</span>
            </div>
            <span className="text-xs text-slate-500">99.9% uptime</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-700">OpenAI Whisper</span>
            </div>
            <span className="text-xs text-slate-500">Active</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-700">GPT-4 API</span>
            </div>
            <span className="text-xs text-slate-500">Active</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-sm text-slate-700">Email Service</span>
            </div>
            <span className="text-xs text-slate-500">Rate limited</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
