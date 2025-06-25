
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, User, Truck, Phone, Award, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Driver {
  id: number;
  name: string;
  phoneNumber: string;
  licenseNumber: string;
  qualification: string;
  isAvailable: boolean;
  experience?: string;
  specializations?: string;
}

interface TruckData {
  id: number;
  truckNumber: string;
  make: string;
  model: string;
  year: number;
  truckType: string;
  weightCapacity: string;
  isAvailable: boolean;
  currentLocation?: string;
}

export function FleetManagement() {
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isTruckDialogOpen, setIsTruckDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const response = await fetch("/api/drivers");
      if (!response.ok) throw new Error("Failed to fetch drivers");
      return response.json();
    },
  });

  // Fetch trucks
  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ["trucks"],
    queryFn: async () => {
      const response = await fetch("/api/trucks");
      if (!response.ok) throw new Error("Failed to fetch trucks");
      return response.json();
    },
  });

  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: async (driverData: Omit<Driver, "id">) => {
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverData),
      });
      if (!response.ok) throw new Error("Failed to create driver");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setIsDriverDialogOpen(false);
      toast({ title: "Driver added successfully" });
    },
  });

  // Create truck mutation
  const createTruckMutation = useMutation({
    mutationFn: async (truckData: Omit<TruckData, "id">) => {
      const response = await fetch("/api/trucks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(truckData),
      });
      if (!response.ok) throw new Error("Failed to create truck");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      setIsTruckDialogOpen(false);
      toast({ title: "Truck added successfully" });
    },
  });

  // Toggle availability mutations
  const toggleDriverAvailability = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      const response = await fetch(`/api/drivers/${id}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });
      if (!response.ok) throw new Error("Failed to update driver availability");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  const toggleTruckAvailability = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      const response = await fetch(`/api/trucks/${id}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });
      if (!response.ok) throw new Error("Failed to update truck availability");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
    },
  });

  const handleDriverSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const driverData = {
      name: formData.get("name") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      licenseNumber: formData.get("licenseNumber") as string,
      qualification: formData.get("qualification") as string,
      experience: formData.get("experience") as string,
      specializations: formData.get("specializations") as string,
      isAvailable: true,
    };
    createDriverMutation.mutate(driverData);
  };

  const handleTruckSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const truckData = {
      truckNumber: formData.get("truckNumber") as string,
      make: formData.get("make") as string,
      model: formData.get("model") as string,
      year: parseInt(formData.get("year") as string),
      truckType: formData.get("truckType") as string,
      weightCapacity: formData.get("weightCapacity") as string,
      currentLocation: formData.get("currentLocation") as string,
      isAvailable: true,
    };
    createTruckMutation.mutate(truckData);
  };

  const availableDrivers = drivers.filter((d: Driver) => d.isAvailable).length;
  const availableTrucks = trucks.filter((t: TruckData) => t.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Drivers</p>
                <p className="text-2xl font-bold">{availableDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Trucks</p>
                <p className="text-2xl font-bold">{trucks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Trucks</p>
                <p className="text-2xl font-bold">{availableTrucks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Management Tabs */}
      <Tabs defaultValue="drivers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="trucks">Trucks</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Driver Management</CardTitle>
                <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Driver
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Driver</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDriverSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input id="phoneNumber" name="phoneNumber" type="tel" required />
                      </div>
                      <div>
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input id="licenseNumber" name="licenseNumber" required />
                      </div>
                      <div>
                        <Label htmlFor="qualification">Qualification</Label>
                        <Select name="qualification" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select qualification" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CDL Class A">CDL Class A</SelectItem>
                            <SelectItem value="CDL Class B">CDL Class B</SelectItem>
                            <SelectItem value="CDL Class C">CDL Class C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="experience">Experience</Label>
                        <Input id="experience" name="experience" placeholder="e.g., 5 years" />
                      </div>
                      <div>
                        <Label htmlFor="specializations">Specializations</Label>
                        <Input id="specializations" name="specializations" placeholder="e.g., Flatbed, Hazmat" />
                      </div>
                      <Button type="submit" disabled={createDriverMutation.isPending}>
                        {createDriverMutation.isPending ? "Adding..." : "Add Driver"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {driversLoading ? (
                <div>Loading drivers...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Qualification</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver: Driver) => (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            {driver.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {driver.phoneNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            {driver.qualification}
                          </Badge>
                        </TableCell>
                        <TableCell>{driver.experience || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={driver.isAvailable ? "default" : "secondary"}>
                            {driver.isAvailable ? "Available" : "Busy"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={driver.isAvailable}
                            onCheckedChange={(checked) =>
                              toggleDriverAvailability.mutate({ id: driver.id, isAvailable: checked })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trucks">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Truck Management</CardTitle>
                <Dialog open={isTruckDialogOpen} onOpenChange={setIsTruckDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Truck
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Truck</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTruckSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="truckNumber">Truck Number</Label>
                        <Input id="truckNumber" name="truckNumber" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="make">Make</Label>
                          <Input id="make" name="make" required />
                        </div>
                        <div>
                          <Label htmlFor="model">Model</Label>
                          <Input id="model" name="model" required />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="year">Year</Label>
                        <Input id="year" name="year" type="number" min="1990" max="2030" required />
                      </div>
                      <div>
                        <Label htmlFor="truckType">Truck Type</Label>
                        <Select name="truckType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select truck type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lowboy">Lowboy</SelectItem>
                            <SelectItem value="Step Deck">Step Deck (Straight Equipment Trailer)</SelectItem>
                            <SelectItem value="Double Drop">Double Drop Equipment Trailer</SelectItem>
                            <SelectItem value="Rollback">Rollback</SelectItem>
                            <SelectItem value="Hot Shot">Hot Shot Trailer</SelectItem>
                            <SelectItem value="Dry Van">3 Axle Tractor (Power Only)</SelectItem>
                            <SelectItem value="Flatbed">3500 Pickup Truck with 10' Flatbed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="weightCapacity">Weight Capacity</Label>
                        <Input id="weightCapacity" name="weightCapacity" placeholder="e.g., 80,000 lbs" required />
                      </div>
                      <div>
                        <Label htmlFor="currentLocation">Current Location</Label>
                        <Input id="currentLocation" name="currentLocation" placeholder="e.g., New York, NY" />
                      </div>
                      <Button type="submit" disabled={createTruckMutation.isPending}>
                        {createTruckMutation.isPending ? "Adding..." : "Add Truck"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {trucksLoading ? (
                <div>Loading trucks...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Truck #</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trucks.map((truck: TruckData) => (
                      <TableRow key={truck.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Truck className="w-4 h-4 mr-2 text-gray-400" />
                            {truck.truckNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          {truck.year} {truck.make} {truck.model}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{truck.truckType}</Badge>
                        </TableCell>
                        <TableCell>{truck.weightCapacity}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {truck.currentLocation || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={truck.isAvailable ? "default" : "secondary"}>
                            {truck.isAvailable ? "Available" : "In Use"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={truck.isAvailable}
                            onCheckedChange={(checked) =>
                              toggleTruckAvailability.mutate({ id: truck.id, isAvailable: checked })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
