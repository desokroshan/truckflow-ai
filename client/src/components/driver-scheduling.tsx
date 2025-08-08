import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Truck, User, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Driver, DriverSchedule, InsertDriverSchedule } from "@shared/schema";

interface DriverSchedulingProps {
  selectedDriverId?: number;
}

export default function DriverScheduling({ selectedDriverId }: DriverSchedulingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DriverSchedule | null>(null);
  const [formData, setFormData] = useState({
    driverId: selectedDriverId || 0,
    title: "",
    startDate: "",
    endDate: "",
    loadId: "",
    notes: "",
    isExternalAssignment: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch drivers
  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  // Fetch driver schedules
  const { data: schedules = [] } = useQuery<DriverSchedule[]>({
    queryKey: ["/api/driver-schedules"],
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: InsertDriverSchedule) => {
      const response = await fetch("/api/driver-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });
      if (!response.ok) throw new Error("Failed to create schedule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver-schedules"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Schedule Created",
        description: "Driver schedule has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create driver schedule.",
        variant: "destructive",
      });
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DriverSchedule> }) => {
      const response = await fetch(`/api/driver-schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update schedule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver-schedules"] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      toast({
        title: "Schedule Updated",
        description: "Driver schedule has been updated successfully.",
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/driver-schedules/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete schedule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver-schedules"] });
      toast({
        title: "Schedule Deleted",
        description: "Driver schedule has been deleted successfully.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      driverId: selectedDriverId || 0,
      title: "",
      startDate: "",
      endDate: "",
      loadId: "",
      notes: "",
      isExternalAssignment: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduleData: InsertDriverSchedule = {
      driverId: formData.driverId,
      title: formData.title,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      loadId: formData.loadId || null,
      notes: formData.notes || null,
      isExternalAssignment: formData.isExternalAssignment,
      status: "scheduled",
    };

    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data: scheduleData });
    } else {
      createScheduleMutation.mutate(scheduleData);
    }
  };

  const handleEdit = (schedule: DriverSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      driverId: schedule.driverId,
      title: schedule.title,
      startDate: new Date(schedule.startDate).toISOString().slice(0, 16),
      endDate: new Date(schedule.endDate).toISOString().slice(0, 16),
      loadId: schedule.loadId || "",
      notes: schedule.notes || "",
      isExternalAssignment: schedule.isExternalAssignment || false,
    });
    setIsDialogOpen(true);
  };

  const getDriverName = (driverId: number) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || `Driver ${driverId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isDriverBusy = (driverId: number) => {
    const now = new Date();
    return schedules.some(schedule => 
      schedule.driverId === driverId && 
      schedule.status === 'scheduled' &&
      new Date(schedule.startDate) <= now && 
      new Date(schedule.endDate) >= now
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Driver Scheduling</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingSchedule(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Edit Schedule" : "Create Driver Schedule"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="driver">Driver</Label>
                <Select
                  value={formData.driverId.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, driverId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        {driver.name} {isDriverBusy(driver.id) && "(Currently Busy)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., External Load Assignment"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="loadId">Load ID (Optional)</Label>
                <Input
                  id="loadId"
                  value={formData.loadId}
                  onChange={(e) => setFormData(prev => ({ ...prev, loadId: e.target.value }))}
                  placeholder="e.g., EXT-2025-ABC123"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this assignment"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isExternalAssignment"
                  checked={formData.isExternalAssignment}
                  onChange={(e) => setFormData(prev => ({ ...prev, isExternalAssignment: e.target.checked }))}
                />
                <Label htmlFor="isExternalAssignment">External Assignment (outside this app)</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                >
                  {editingSchedule ? "Update" : "Create"} Schedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Driver Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Driver Availability Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map(driver => (
              <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{driver.name}</p>
                  <p className="text-sm text-gray-600">{driver.phoneNumber}</p>
                </div>
                <Badge className={isDriverBusy(driver.id) ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                  {isDriverBusy(driver.id) ? "Busy" : "Available"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Scheduled Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No schedules created yet.</p>
            ) : (
              schedules.map(schedule => (
                <div key={schedule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">{getDriverName(schedule.driverId)}</span>
                      <Badge className={getStatusColor(schedule.status)}>
                        {schedule.status}
                      </Badge>
                      {schedule.isExternalAssignment && (
                        <Badge variant="outline">External</Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                        disabled={deleteScheduleMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold mb-2">{schedule.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>
                        {new Date(schedule.startDate).toLocaleString()} - {new Date(schedule.endDate).toLocaleString()}
                      </span>
                    </div>
                    {schedule.loadId && (
                      <div>
                        <strong>Load ID:</strong> {schedule.loadId}
                      </div>
                    )}
                  </div>
                  
                  {schedule.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Notes:</strong> {schedule.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}