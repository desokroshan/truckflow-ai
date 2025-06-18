
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Truck, Package, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoadRequest {
  id: number;
  loadId: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  deliveryLocation: string;
  cargoType: string;
  weight: string;
  truckType: string;
  status: string;
  createdAt: string;
}

interface Document {
  id: number;
  documentType: string;
  fileName: string;
  uploadedAt: string;
}

export function ShipperDashboard({ user }: { user: any }) {
  const [selectedLoadForUpload, setSelectedLoadForUpload] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch shipper's load requests
  const { data: loadRequests = [], isLoading } = useQuery({
    queryKey: ["shipper-loads"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/shipper/load-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch load requests");
      return response.json();
    },
  });

  // Document upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ loadRequestId, documentType, file }: { loadRequestId: number; documentType: string; file: File }) => {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("document", file);
      formData.append("loadRequestId", loadRequestId.toString());
      formData.append("documentType", documentType);

      const response = await fetch("/api/shipper/upload-document", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload document");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Document has been uploaded successfully",
      });
      setUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["load-documents"] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("document") as File;
    const documentType = formData.get("documentType") as string;

    if (!file || !documentType || !selectedLoadForUpload) {
      toast({
        title: "Missing Information",
        description: "Please select a file and document type",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      loadRequestId: selectedLoadForUpload,
      documentType,
      file,
    });
  };

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

  if (isLoading) {
    return <div className="p-8 text-center">Loading your loads...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Truck className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Shipper Portal</h1>
                  <p className="text-xs text-slate-500">Welcome, {user.companyName || user.username}</p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.reload();
            }}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Loads</p>
                  <p className="text-2xl font-bold">{loadRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Loads</p>
                  <p className="text-2xl font-bold">
                    {loadRequests.filter((load: LoadRequest) => load.status === 'approved' || load.status === 'in_transit').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold">
                    {loadRequests.filter((load: LoadRequest) => load.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Load Requests Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your Load Requests</CardTitle>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="load-select">Select Load</Label>
                      <Select onValueChange={(value) => setSelectedLoadForUpload(parseInt(value))} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a load..." />
                        </SelectTrigger>
                        <SelectContent>
                          {loadRequests.map((load: LoadRequest) => (
                            <SelectItem key={load.id} value={load.id.toString()}>
                              {load.loadId} - {load.pickupLocation} → {load.deliveryLocation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="documentType">Document Type</Label>
                      <Select name="documentType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BOL">Bill of Lading (BOL)</SelectItem>
                          <SelectItem value="POD">Proof of Delivery (POD)</SelectItem>
                          <SelectItem value="Invoice">Invoice</SelectItem>
                          <SelectItem value="Receipt">Receipt</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="document">Select File</Label>
                      <Input id="document" name="document" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required />
                    </div>
                    <Button type="submit" disabled={uploadMutation.isPending}>
                      {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadRequests.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No load requests found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadRequests.map((load: LoadRequest) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">{load.loadId}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{load.pickupLocation}</div>
                          <div className="text-gray-500">→ {load.deliveryLocation}</div>
                        </div>
                      </TableCell>
                      <TableCell>{load.cargoType}</TableCell>
                      <TableCell>{load.weight}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(load.status)}>
                          {load.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(load.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
