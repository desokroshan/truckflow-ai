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
import { Check, X, Eye, Download, Filter, Truck, MapPin, Mic2, Brain } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LoadRequest } from "@shared/schema";
import { useState } from "react";

// Load Request Details Modal Component
function LoadRequestDetailsModal({ load }: { load: LoadRequest }) {
  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Load Request Details - {load.loadId}
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-900">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Name:</span>
              <span className="text-slate-900 font-medium">{load.customerName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Phone:</span>
              <span className="text-slate-900">{load.customerPhone}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Email:</span>
              <span className="text-slate-900">{load.customerEmail || 'Not provided'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-900">Route Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Pickup:</span>
              <span className="text-slate-900 text-right flex-1 ml-2">{load.pickupLocation}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Delivery:</span>
              <span className="text-slate-900 text-right flex-1 ml-2">{load.deliveryLocation}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Distance:</span>
              <span className="text-slate-900">N/A</span>
            </div>
          </CardContent>
        </Card>

        {/* Load Details & Timestamps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-900">Load Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Cargo Type:</span>
              <span className="text-slate-900">{load.cargoType}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Weight:</span>
              <span className="text-slate-900">{load.weight}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Truck Type:</span>
              <span className="text-slate-900">{load.truckType}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Special Requirements:</span>
              <span className="text-slate-900">None</span>
            </div>
            <div className="border-t border-slate-200 my-3"></div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Created:</span>
              <span className="text-slate-900">
                {load.createdAt ? new Date(load.createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>
            {load.approvedAt && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Approved:</span>
                <span className="text-slate-900">
                  {new Date(load.approvedAt).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Processing Results */}
        {(load.transcription || load.extractedData) && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Processing Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {load.transcription && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Transcription:</label>
                  <div className="bg-slate-50 p-3 rounded-md text-xs text-slate-700 max-h-32 overflow-y-auto">
                    {load.transcription}
                  </div>
                </div>
              )}
              
              {load.extractedData && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Extracted Data:</label>
                  <div className="bg-slate-50 p-3 rounded-md text-xs text-slate-700 max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(JSON.parse(load.extractedData), null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DialogContent>
  );
}

export default function LoadDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLoad, setSelectedLoad] = useState<LoadRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
                  <TableHead>Equipment</TableHead>
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
                              onClick={() => handleApprove(load.id)}
                              disabled={approveMutation.isPending}
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleReject(load.id)}
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('View Details button clicked, load:', load);
                            setSelectedLoad(load);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
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
    </Card>
  );
}
