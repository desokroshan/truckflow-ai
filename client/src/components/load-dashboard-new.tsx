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
import { Check, X, Eye, Download, Filter, Truck, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LoadRequest } from "@shared/schema";

export default function LoadDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
            <TableHead>Status</TableHead>
            {showApproveButton && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((load) => (
            <TableRow key={load.id}>
              <TableCell className="font-mono text-sm">
                {load.loadId}
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
                        onClick={() => approveMutation.mutate(load.id)}
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
                      onClick={() => {/* View details logic */}}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
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
              {renderLoadTable(loadRequests)}
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
                renderLoadTable(approvedRequests, false)
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}