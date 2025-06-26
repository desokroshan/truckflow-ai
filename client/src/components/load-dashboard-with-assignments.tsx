import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check, X, Eye, User, Truck, MapPin, Package, Weight, Calendar, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  deadline?: string;
}

interface Driver {
  id: number;
  name: string;
  phoneNumber: string;
  qualification: string;
  experience?: string;
  specializations?: string;
}

interface TruckData {
  id: number;
  truckNumber: string;
  make: string;
  model: string;
  truckType: string;
  weightCapacity: string;
  currentLocation?: string;
}

interface Assignment {
  id: number;
  loadRequestId: number;
  driverId?: number;
  truckId?: number;
  status: string;
}

interface Recommendations {
  recommendedDriver?: Driver;
  recommendedTruck?: TruckData;
  availableDrivers: Driver[];
  availableTrucks: TruckData[];
}

export function LoadDashboardWithAssignments() {
  const [selectedLoad, setSelectedLoad] = useState<LoadRequest | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch load requests
  const { data: loads = [], isLoading: loadsLoading } = useQuery({
    queryKey: ["load-requests"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      console.log("Token from here2:", token);
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

  // Fetch assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const response = await fetch("/api/assignments");
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
  });

  // Fetch recommendations for a specific load
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["recommendations", selectedLoad?.id],
    queryFn: async () => {
      if (!selectedLoad) return null;
      const response = await fetch(`/api/load-requests/${selectedLoad.id}/recommendations`);
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      return response.json();
    },
    enabled: !!selectedLoad,
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: { loadRequestId: number; driverId?: number; truckId?: number }) => {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentData),
      });
      if (!response.ok) throw new Error("Failed to create assignment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["load-requests"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      setIsAssignmentDialogOpen(false);
      setSelectedLoad(null);
      toast({ title: "Assignment created successfully" });
    },
  });

  // Auto-assign mutation
  const autoAssignMutation = useMutation({
    mutationFn: async (loadRequestId: number) => {
      const response = await fetch(`/api/load-requests/${loadRequestId}/auto-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to auto-assign");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["load-requests"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({ title: "Auto-assignment successful" });
    },
  });

  // Approve load mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/load-requests/${id}/approve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to approve load request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["load-requests"] });
      toast({ title: "Load request approved" });
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
      case "assigned":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getAssignmentForLoad = (loadId: number) => {
    return assignments.find((assignment: Assignment) => assignment.loadRequestId === loadId);
  };

  const handleAssignmentSubmit = () => {
    if (!selectedLoad) return;

    const assignmentData = {
      loadRequestId: selectedLoad.id,
      driverId: selectedDriverId ? parseInt(selectedDriverId) : undefined,
      truckId: selectedTruckId ? parseInt(selectedTruckId) : undefined,
    };

    createAssignmentMutation.mutate(assignmentData);
  };

  const openAssignmentDialog = (load: LoadRequest) => {
    setSelectedLoad(load);
    setIsAssignmentDialogOpen(true);
    // Reset selections
    setSelectedDriverId("");
    setSelectedTruckId("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Load Requests with Assignment Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {loadsLoading ? (
            <div>Loading load requests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map((load: LoadRequest) => {
                  const assignment = getAssignmentForLoad(load.id);
                  return (
                    <TableRow key={load.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">{load.loadId}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{load.customerName}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {load.customerPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-sm">
                            {load.pickupLocation} → {load.deliveryLocation}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center">
                            <Package className="w-4 h-4 mr-1 text-gray-400" />
                            <span className="text-sm">{load.cargoType}</span>
                          </div>
                          <div className="flex items-center">
                            <Weight className="w-4 h-4 mr-1 text-gray-400" />
                            <span className="text-xs text-gray-500">{load.weight}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(load.status)}>
                          {load.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Assigned
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-600">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {load.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(load.id)}
                              disabled={approveMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          {!assignment && load.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAssignmentDialog(load)}
                              className="bg-blue-50 hover:bg-blue-100"
                            >
                              <User className="w-4 h-4 mr-1" />
                              Assign
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedLoad(load)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assign Driver & Truck - {selectedLoad?.loadId}</DialogTitle>
          </DialogHeader>

          {selectedLoad && (
            <div className="space-y-6">
              {/* Load Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Load Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Customer:</strong> {selectedLoad.customerName}
                    </div>
                    <div>
                      <strong>Phone:</strong> {selectedLoad.customerPhone}
                    </div>
                    <div>
                      <strong>Pickup:</strong> {selectedLoad.pickupLocation}
                    </div>
                    <div>
                      <strong>Delivery:</strong> {selectedLoad.deliveryLocation}
                    </div>
                    <div>
                      <strong>Cargo:</strong> {selectedLoad.cargoType}
                    </div>
                    <div>
                      <strong>Weight:</strong> {selectedLoad.weight}
                    </div>
                    <div>
                      <strong>Truck Type:</strong> {selectedLoad.truckType}
                    </div>
                    {selectedLoad.deadline && (
                      <div>
                        <strong>Deadline:</strong> {selectedLoad.deadline}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {recommendationsLoading ? (
                <div>Loading recommendations...</div>
              ) : recommendations ? (
                <div className="grid grid-cols-2 gap-6">
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
                        <Label htmlFor="driver-select">Select Driver</Label>
                        <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a driver..." />
                          </SelectTrigger>
                          <SelectContent>
                            {recommendations.availableDrivers.map((driver: Driver) => (
                              <SelectItem key={driver.id} value={driver.id.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{driver.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {driver.email} • {driver.standardBillingRate}
                                  </span>
                                </div>
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
                            <div>Location: {recommendations.recommendedTruck.currentLocation || "N/A"}</div>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="truck-select">Select Truck</Label>
                        <Select value={selectedTruckId} onValueChange={setSelectedTruckId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a truck..." />
                          </SelectTrigger>
                          <SelectContent>
                            {recommendations.availableTrucks.map((truck: TruckData) => (
                              <SelectItem key={truck.id} value={truck.id.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{truck.truckNumber}</span>
                                  <span className="text-xs text-gray-500">
                                    {truck.truckType} • {truck.weightCapacity}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

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
    </div>
  );
}