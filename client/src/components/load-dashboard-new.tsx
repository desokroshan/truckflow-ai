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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, X, Eye, Download, Filter, Truck, MapPin, Mic2, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LoadRequest } from "@shared/schema";
import { useState } from "react";
import SimpleModalTest from "./simple-modal-test";

// Load Request Details Modal Component
function LoadRequestDetailsModal({ load }: { load: LoadRequest }) {
  const extractedData = load.extractedData ? JSON.parse(load.extractedData) : null;
  
  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          Load Request Details - {load.loadId}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-900">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Name</label>
                <p className="text-sm text-slate-900">{load.customerName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Phone</label>
                <p className="text-sm text-slate-900">{load.customerPhone}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Status</label>
                <Badge 
                  variant={load.status === "approved" ? "default" : "secondary"}
                  className={load.status === "approved" ? "bg-green-100 text-green-800" : ""}
                >
                  {load.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-900">Shipment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Cargo Type</label>
                <p className="text-sm text-slate-900">{load.cargoType}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Weight</label>
                <p className="text-sm text-slate-900">{load.weight}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Truck Type</label>
                <p className="text-sm text-slate-900">{load.truckType}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Route Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-900 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600">Pickup Location</label>
                <p className="text-sm text-slate-900">{load.pickupLocation}</p>
                <p className="text-xs text-slate-500 mt-1">{load.pickupAddress}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Delivery Location</label>
                <p className="text-sm text-slate-900">{load.deliveryLocation}</p>
                <p className="text-xs text-slate-500 mt-1">{load.deliveryAddress}</p>
              </div>
            </div>
            
            {(load.pickupTime || load.deliveryTime || load.deadline) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                {load.pickupTime && (
                  <div>
                    <label className="text-xs font-medium text-slate-600">Pickup Time</label>
                    <p className="text-sm text-slate-900">{load.pickupTime}</p>
                  </div>
                )}
                {load.deliveryTime && (
                  <div>
                    <label className="text-xs font-medium text-slate-600">Delivery Time</label>
                    <p className="text-sm text-slate-900">{load.deliveryTime}</p>
                  </div>
                )}
                {load.deadline && (
                  <div>
                    <label className="text-xs font-medium text-slate-600">Deadline</label>
                    <p className="text-sm text-slate-900">{load.deadline}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Processing Results */}
        <div className="space-y-4">
          {/* Transcription */}
          {load.transcription && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-900 flex items-center">
                  <Mic2 className="w-4 h-4 mr-2 text-blue-500" />
                  Transcription (OpenAI Whisper)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {load.transcription}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted Data */}
          {extractedData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-900 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-purple-500" />
                  AI Extracted Data (GPT-4)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-lg p-4">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                    {JSON.stringify(extractedData, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Additional Notes */}
        {load.additionalNotes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-900">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{load.additionalNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-900">Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
  });

  // Filter load requests by status
  const pendingRequests = loadRequests.filter(load => load.status === "pending");
  const approvedRequests = loadRequests.filter(load => load.status === "approved");

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/load-requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/load-requests"] });
      toast({
        title: "Load Approved",
        description: "The load request has been approved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve load request",
        variant: "destructive",
      });
    },
  });

  const renderLoadTable = (loads: LoadRequest[], showApproveButton = true) => (
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
            {showApproveButton && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((load) => (
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
              <TableCell className="font-mono text-sm">
                <span className="hover:text-blue-600 hover:underline cursor-pointer">
                  {load.loadId}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{load.customerName}</span>
                  <span className="text-sm text-gray-500">{load.customerPhone}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm">{load.pickupLocation}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-400">to</span>
                    <span className="text-sm">{load.deliveryLocation}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{load.truckType}</span>
                  <span className="text-xs text-gray-500">{load.weight}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {load.createdAt ? new Date(load.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={load.status === "approved" ? "default" : "secondary"}
                  className={load.status === "approved" ? "bg-green-100 text-green-800" : ""}
                >
                  {load.status}
                </Badge>
              </TableCell>
              {showApproveButton && (
                <TableCell>
                  <div className="flex gap-2">
                    {load.status === "pending" && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          approveMutation.mutate(load.id);
                        }}
                        disabled={approveMutation.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('View Details button clicked, load:', load);
                        setSelectedLoad(load);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Load Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-500">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Load Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Debug Modal Test */}
        <SimpleModalTest />
        
        {loadRequests.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-500 text-lg">No load requests yet</p>
            <p className="text-slate-400 text-sm">Make a call to get started</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({loadRequests.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedRequests.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {renderLoadTable(loadRequests, true)}
            </TabsContent>
            
            <TabsContent value="pending" className="mt-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Filter className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-500">No pending requests</p>
                </div>
              ) : (
                renderLoadTable(pendingRequests, true)
              )}
            </TabsContent>
            
            <TabsContent value="approved" className="mt-4">
              {approvedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Check className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-500">No approved requests</p>
                </div>
              ) : (
                renderLoadTable(approvedRequests, true)
              )}
            </TabsContent>
          </Tabs>
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