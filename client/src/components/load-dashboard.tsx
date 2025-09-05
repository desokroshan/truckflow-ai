import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Download, Filter, Truck, MapPin, Mic2, Brain, User, Bug, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateLoadRequestForm } from "./create-load-request-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LoadRequest, Driver, TruckData, Assignment } from "@shared/schema";
import { useState } from "react";
import * as React from "react";

// Load Request Details Modal Component
function LoadRequestDetailsModal({ load }: { load: LoadRequest }) {
  // Helper function to check if address is validated
  const isAddressValidated = (address: string) => {
    // For now, we'll assume address is validated if it contains standard address components
    // In a real implementation, this would check against actual validation results
    const hasNumber = /\d/.test(address);
    const hasStreet = /\b(st|street|ave|avenue|blvd|boulevard|rd|road|ln|lane|dr|drive|ct|court|pl|place|way)\b/i.test(address);
    const hasState = /\b[A-Z]{2}\b/.test(address);
    const hasZip = /\b\d{5}(-\d{4})?\b/.test(address);
    return hasNumber && hasStreet && hasState && hasZip;
  };

  const renderAddressValidation = (address: string) => {
    if (!isAddressValidated(address)) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
          Not Validated
        </Badge>
      );
    }
    return null;
  };

  return (
    <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Load Request Details - {load.loadId}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6 mt-4">
        {/* Route Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-900 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pick Up Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-green-700 text-sm border-b border-green-200 pb-1">Pick Up</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Address</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-900">{load.pickupAddress || load.pickupLocation}</span>
                      {renderAddressValidation(load.pickupAddress || load.pickupLocation)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Time Frame</label>
                    <span className="text-sm text-slate-900">{load.pickupTime || 'Not specified'}</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Special Instructions</label>
                    <span className="text-sm text-slate-900">{load.additionalNotes || 'None'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Point of Contact, Name</label>
                    <span className="text-sm text-slate-900">{load.pickupContactName || 'Not specified'}</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Point of Contact, Phone</label>
                    <span className="text-sm text-slate-900">{load.pickupContactPhone || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drop Off Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-blue-700 text-sm border-b border-blue-200 pb-1">Drop Off(s)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Address</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-900">{load.deliveryAddress || load.deliveryLocation}</span>
                      {renderAddressValidation(load.deliveryAddress || load.deliveryLocation)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Time Frame</label>
                    <span className="text-sm text-slate-900">{load.deliveryTime || load.deadline || 'Not specified'}</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Special Instructions</label>
                    <span className="text-sm text-slate-900">None</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Point of Contact, Name</label>
                    <span className="text-sm text-slate-900">Not specified</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Point of Contact, Phone</label>
                    <span className="text-sm text-slate-900">Not specified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Pickup Locations */}
            {load.pickupLocations && (() => {
              try {
                const pickupLocations = JSON.parse(load.pickupLocations);
                if (pickupLocations && pickupLocations.length > 0) {
                  return (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium text-green-700 text-sm">Additional Pick Up Locations</h4>
                      {pickupLocations.map((location: any, index: number) => (
                        <div key={index} className="bg-green-50 p-4 rounded-lg space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Address</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-900">{location.address}</span>
                                  {renderAddressValidation(location.address)}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Time Frame</label>
                                <span className="text-sm text-slate-900">{location.scheduledTime ? new Date(location.scheduledTime).toLocaleString() : 'Not specified'}</span>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Special Instructions</label>
                                <span className="text-sm text-slate-900">{location.instructions || 'None'}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Point of Contact, Name</label>
                                <span className="text-sm text-slate-900">{location.contactName || 'Not specified'}</span>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Point of Contact, Phone</label>
                                <span className="text-sm text-slate-900">{location.contactPhone || 'Not specified'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
              } catch (e) {
                return null;
              }
              return null;
            })()}

            {/* Additional Delivery Locations */}
            {load.deliveryLocations && (() => {
              try {
                const deliveryLocations = JSON.parse(load.deliveryLocations);
                if (deliveryLocations && deliveryLocations.length > 0) {
                  return (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium text-blue-700 text-sm">Additional Drop Off Locations</h4>
                      {deliveryLocations.map((location: any, index: number) => (
                        <div key={index} className="bg-blue-50 p-4 rounded-lg space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Address</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-900">{location.address}</span>
                                  {renderAddressValidation(location.address)}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Time Frame</label>
                                <span className="text-sm text-slate-900">{location.scheduledTime ? new Date(location.scheduledTime).toLocaleString() : 'Not specified'}</span>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Special Instructions</label>
                                <span className="text-sm text-slate-900">{location.instructions || 'None'}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Point of Contact, Name</label>
                                <span className="text-sm text-slate-900">{location.contactName || 'Not specified'}</span>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Point of Contact, Phone</label>
                                <span className="text-sm text-slate-900">{location.contactPhone || 'Not specified'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
              } catch (e) {
                return null;
              }
              return null;
            })()}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-900 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Company Name</label>
                <span className="text-sm text-slate-900">{load.customerName}</span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Name</label>
                <span className="text-sm text-slate-900">{load.customerName}</span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
                <span className="text-sm text-slate-900">
                  {load.customerEmail && load.customerEmail !== 'unknown' && load.customerEmail !== 'null' 
                    ? load.customerEmail 
                    : 'Not provided'}
                </span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Phone (Optional)</label>
                <span className="text-sm text-slate-900">{load.customerPhone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Load Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-900 flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                Load Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Cargo Type: Make, Model</label>
                <span className="text-sm text-slate-900">{load.cargoType}</span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Load Created (Date)</label>
                <span className="text-sm text-slate-900">
                  {load.createdAt ? new Date(load.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Load Approved (Date)</label>
                <span className="text-sm text-slate-900">
                  {load.approvedAt ? new Date(load.approvedAt).toLocaleDateString() : 'Not approved yet'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DialogContent>
  );
}

export default function LoadDashboard() {
  console.log("[MLOG]Loading dashboard");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLoad, setSelectedLoad] = useState<LoadRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isBugReportDialogOpen, setIsBugReportDialogOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const [rationale, setRationale] = useState<string>("");
  const [bugReportData, setBugReportData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "General"
  });
  const [recommendations, setRecommendations] = useState<{
    recommendedDriver: Driver | null;
    recommendedTruck: Truck | null;
    confidence: number;
    reason: string;
  }>({
    recommendedDriver: null,
    recommendedTruck: null,
    confidence: 0,
    reason: ""
  });

  console.log('LoadDashboard render - isDialogOpen:', isDialogOpen, 'selectedLoad:', selectedLoad?.loadId);
  
  const { data: loadRequests = [], isLoading } = useQuery<LoadRequest[]>({
    queryKey: ["/api/load-requests"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/load-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  });

  // Fetch drivers for assignment
  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const response = await fetch("/api/drivers");
      if (!response.ok) throw new Error("Failed to fetch drivers");
      return response.json();
    },
  });

  // Fetch trucks for assignment
  const { data: trucks = [] } = useQuery<TruckData[]>({
    queryKey: ["/api/trucks"],
    queryFn: async () => {
      const response = await fetch("/api/trucks");
      if (!response.ok) throw new Error("Failed to fetch trucks");
      return response.json();
    },
  });

  // Fetch recommendations when assignment dialog opens
  const { data: recommendationsData, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ["/api/assignments/recommendations", selectedLoad?.id],
    queryFn: async () => {
      if (!selectedLoad) return null;
      const response = await fetch(`/api/assignments/recommendations/${selectedLoad.id}`);
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      return response.json();
    },
    enabled: isAssignmentDialogOpen && !!selectedLoad,
  });

  // Update recommendations when data changes
  React.useEffect(() => {
    if (recommendationsData) {
      setRecommendations(recommendationsData);
    }
  }, [recommendationsData]);

  // Filter load requests by status
  const pendingRequests = loadRequests.filter(load => load.status === "pending");
  const approvedRequests = loadRequests.filter(load => load.status === "approved");

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

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: {
      loadRequestId: number;
      driverId?: number;
      truckId?: number;
      rationale?: string;
    }) => {
      return await apiRequest("POST", "/api/assignments", assignmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/load-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      setIsAssignmentDialogOpen(false);
      setSelectedLoad(null);
      setSelectedDriverId("");
      setSelectedTruckId("");
      setRationale("");
      toast({
        title: "Assignment Created",
        description: "Load has been assigned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getTruckTypeColor = (truckType: string) => {
    switch (truckType.toLowerCase()) {
      case "dry van":
        return "bg-blue-100 text-blue-800";
      case "flatbed":
        return "bg-green-100 text-green-800";
      case "reefer":
        return "bg-purple-100 text-purple-800";
      case "box truck":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(id);
  };

  const openAssignmentDialog = (load: LoadRequest) => {
    setSelectedLoad(load);
    setIsAssignmentDialogOpen(true);
    // Reset selections
    setSelectedDriverId("");
    setSelectedTruckId("");
    setRationale("");
  };

  const handleAssignmentSubmit = () => {
    if (!selectedLoad) return;

    const assignmentData = {
      loadRequestId: selectedLoad.id,
      driverId: selectedDriverId ? parseInt(selectedDriverId) : undefined,
      truckId: selectedTruckId ? parseInt(selectedTruckId) : undefined,
      rationale: rationale ? rationale : undefined,
    };

    createAssignmentMutation.mutate(assignmentData);
  };

  const submitBugReportMutation = useMutation({
    mutationFn: async (bugData: { title: string; description: string; priority: string; category: string }) => {
      return await apiRequest("POST", "/api/bug-reports", bugData);
    },
    onSuccess: (data) => {
      toast({
        title: "Bug Report Submitted",
        description: `Bug report ${data.bugId} has been submitted successfully`,
      });
      setIsBugReportDialogOpen(false);
      setBugReportData({
        title: "",
        description: "",
        priority: "Medium",
        category: "General"
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleBugReportSubmit = () => {
    if (!bugReportData.title || !bugReportData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description",
        variant: "destructive",
      });
      return;
    }
    submitBugReportMutation.mutate(bugReportData);
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Load data is being exported to CSV",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recent Load Requests</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={() => setIsCreateFormOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Load Request
            </Button>
            <Button onClick={() => setIsBugReportDialogOpen(true)} variant="outline" size="sm">
              <Bug className="w-4 h-4 mr-2" />
              Report Bug
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadRequests.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-500 text-lg">No load requests yet</p>
            <p className="text-slate-400 text-sm">Upload an audio file or simulate a call to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadRequests.map((load) => (
                  <TableRow 
                    key={load.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Row clicked, load:', load);
                      console.log('Setting dialog open to true');
                      setSelectedLoad(load);
                      setIsDialogOpen(true);
                    }}
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-medium hover:text-blue-600 hover:underline">
                        {load.loadId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{load.customerName}</p>
                        <p className="text-xs text-slate-500">{load.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-slate-900">
                          {load.pickupLocation} → {load.deliveryLocation}
                        </p>
                        <p className="text-xs text-slate-500">
                          {load.weight} • {load.cargoType}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getTruckTypeColor(load.truckType)}
                      >
                        {load.truckType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-900">
                        {load.assignedDriver || "Unassigned"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {load.createdAt ? new Date(load.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={getStatusColor(load.status)}
                      >
                        {load.status.charAt(0).toUpperCase() + load.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {load.status === "pending" && (
                          <>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(load.id);
                              }}
                              disabled={approveMutation.isPending}
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(load.id);
                              }}
                              disabled={rejectMutation.isPending}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {load.status === "approved" && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLoad(load);
                              setIsAssignmentDialogOpen(true);
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Truck className="w-4 h-4" />
                          </Button>
                        )}
                        {load.status === "in_transit" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <MapPin className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog for Load Request Details */}
      {selectedLoad && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <LoadRequestDetailsModal load={selectedLoad} />
        </Dialog>
      )}

      {/* Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Driver & Truck - {selectedLoad?.loadId}</DialogTitle>
          </DialogHeader>

          {selectedLoad && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Load Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Primary Route:</span> {selectedLoad.pickupLocation} → {selectedLoad.deliveryLocation}
                    {selectedLoad.pickupLocations && (() => {
                      try {
                        const pickupLocs = JSON.parse(selectedLoad.pickupLocations);
                        const deliveryLocs = selectedLoad.deliveryLocations ? JSON.parse(selectedLoad.deliveryLocations) : [];
                        const totalStops = pickupLocs.length + deliveryLocs.length;
                        return totalStops > 0 ? <div className="text-xs text-blue-600 mt-1">+ {totalStops} additional stops</div> : null;
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>
                  <div>
                    <span className="font-medium">Cargo:</span> {selectedLoad.cargoType} ({selectedLoad.weight})
                  </div>
                  <div>
                    <span className="font-medium">Truck Type:</span> {selectedLoad.truckType}
                  </div>
                  <div>
                    <span className="font-medium">Customer:</span> {selectedLoad.customerName}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Driver Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Driver Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.recommendedDriver && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Recommended Driver</h4>
                        <div className="space-y-1 text-sm text-green-700">
                          <div><strong>{recommendations.recommendedDriver.name}</strong></div>
                          <div>{recommendations.recommendedDriver.email}</div>
                          <div>{recommendations.recommendedDriver.phoneNumber}</div>
                          <div>Oversized Qualified: {recommendations.recommendedDriver.qualifiedForOversized ? "Yes" : "No"}</div>
                          <div>Standard Rate: {recommendations.recommendedDriver.standardBillingRate}</div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="driver-select" className="text-base font-medium">
                        Select Driver
                      </Label>
                      <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a driver..." />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id.toString()}>
                              {driver.name} - {driver.phoneNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Truck Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      Truck Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.recommendedTruck && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Recommended Truck</h4>
                        <div className="space-y-1 text-sm text-blue-700">
                          <div><strong>{recommendations.recommendedTruck.truckNumber}</strong></div>
                          <div>{recommendations.recommendedTruck.make} {recommendations.recommendedTruck.model}</div>
                          <div>{recommendations.recommendedTruck.truckType} • {recommendations.recommendedTruck.weightCapacity}</div>
                          <div>Location: {recommendations.recommendedTruck.currentLocation || "Yard"}</div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="truck-select" className="text-base font-medium">
                        Select Truck
                      </Label>
                      <Select value={selectedTruckId} onValueChange={setSelectedTruckId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a truck..." />
                        </SelectTrigger>
                        <SelectContent>
                          {trucks.map((truck) => (
                            <SelectItem key={truck.id} value={truck.id.toString()}>
                              {truck.truckNumber} - {truck.make} {truck.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label htmlFor="assignment-rationale" className="text-base font-medium">
                  Assignment Rationale (Optional)
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  Explain why you chose this driver/truck combination:
                </p>
                <Textarea
                  id="assignment-rationale"
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="e.g., Driver has experience with this route, truck is closest to pickup location..."
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignmentSubmit}
                  disabled={createAssignmentMutation.isPending || (!selectedDriverId && !selectedTruckId)}
                >
                  {createAssignmentMutation.isPending ? "Creating Assignment..." : "Create Assignment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bug Report Dialog */}
      <Dialog open={isBugReportDialogOpen} onOpenChange={setIsBugReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Report a Bug
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bug-title" className="text-base font-medium">
                Bug Title *
              </Label>
              <input
                id="bug-title"
                type="text"
                value={bugReportData.title}
                onChange={(e) => setBugReportData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue..."
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="bug-description" className="text-base font-medium">
                Description *
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Describe the bug in detail. Include steps to reproduce, expected vs actual behavior.
              </p>
              <Textarea
                id="bug-description"
                value={bugReportData.description}
                onChange={(e) => setBugReportData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the bug..."
                rows={4}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bug-priority" className="text-base font-medium">
                  Priority
                </Label>
                <Select 
                  value={bugReportData.priority} 
                  onValueChange={(value) => setBugReportData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bug-category" className="text-base font-medium">
                  Category
                </Label>
                <Select 
                  value={bugReportData.category} 
                  onValueChange={(value) => setBugReportData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="UI/UX">UI/UX</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                    <SelectItem value="Data Processing">Data Processing</SelectItem>
                    <SelectItem value="Integration">Integration</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsBugReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBugReportSubmit}
                disabled={submitBugReportMutation.isPending || !bugReportData.title || !bugReportData.description}
              >
                {submitBugReportMutation.isPending ? "Submitting..." : "Submit Bug Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Load Request Form */}
      <CreateLoadRequestForm 
        isOpen={isCreateFormOpen} 
        onClose={() => setIsCreateFormOpen(false)} 
      />
    </Card>
  );
}
