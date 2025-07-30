import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationInput } from "./location-input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import type { Location } from "@shared/schema";

interface CreateLoadRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateLoadRequestForm({ isOpen, onClose }: CreateLoadRequestFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupLocation: "",
    pickupAddress: "",
    pickupContactName: "",
    pickupContactPhone: "",
    deliveryLocation: "",
    deliveryAddress: "",
    cargoType: "",
    weight: "",
    truckType: "",
    pickupTime: "",
    deliveryTime: "",
    deadline: "",
    additionalNotes: "",
  });

  const [pickupLocations, setPickupLocations] = useState<Location[]>([]);
  const [deliveryLocations, setDeliveryLocations] = useState<Location[]>([]);

  const createLoadRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/load-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Load Request Created",
        description: "Load request has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/load-requests"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      pickupLocation: "",
      pickupAddress: "",
      pickupContactName: "",
      pickupContactPhone: "",
      deliveryLocation: "",
      deliveryAddress: "",
      cargoType: "",
      weight: "",
      truckType: "",
      pickupTime: "",
      deliveryTime: "",
      deadline: "",
      additionalNotes: "",
    });
    setPickupLocations([]);
    setDeliveryLocations([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate unique load ID
    const loadId = `TF-${Date.now()}`;
    
    const submitData = {
      ...formData,
      loadId,
      // Include multiple locations as JSON strings
      pickupLocations: pickupLocations.length > 0 ? JSON.stringify(pickupLocations) : null,
      deliveryLocations: deliveryLocations.length > 0 ? JSON.stringify(deliveryLocations) : null,
    };

    createLoadRequestMutation.mutate(submitData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Load Request
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => updateFormData('customerName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => updateFormData('customerPhone', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email Address</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => updateFormData('customerEmail', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Primary Route Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Primary Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Pickup */}
                <div className="space-y-3">
                  <Label className="text-base font-medium text-green-700">Primary Pickup Location</Label>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="pickupLocation">Location *</Label>
                      <Input
                        id="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={(e) => updateFormData('pickupLocation', e.target.value)}
                        placeholder="e.g., Seattle, WA"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pickupAddress">Address *</Label>
                      <Input
                        id="pickupAddress"
                        value={formData.pickupAddress}
                        onChange={(e) => updateFormData('pickupAddress', e.target.value)}
                        placeholder="e.g., 123 Main St, Seattle, WA 98101"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pickupContactName">Contact Name</Label>
                      <Input
                        id="pickupContactName"
                        value={formData.pickupContactName}
                        onChange={(e) => updateFormData('pickupContactName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pickupContactPhone">Contact Phone</Label>
                      <Input
                        id="pickupContactPhone"
                        value={formData.pickupContactPhone}
                        onChange={(e) => updateFormData('pickupContactPhone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Delivery */}
                <div className="space-y-3">
                  <Label className="text-base font-medium text-blue-700">Primary Delivery Location</Label>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="deliveryLocation">Location *</Label>
                      <Input
                        id="deliveryLocation"
                        value={formData.deliveryLocation}
                        onChange={(e) => updateFormData('deliveryLocation', e.target.value)}
                        placeholder="e.g., Phoenix, AZ"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryAddress">Address *</Label>
                      <Input
                        id="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={(e) => updateFormData('deliveryAddress', e.target.value)}
                        placeholder="e.g., 456 Oak Ave, Phoenix, AZ 85001"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multiple Pickup Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Pickup Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationInput
                title="Additional Pickup Locations"
                locations={pickupLocations}
                onChange={setPickupLocations}
              />
            </CardContent>
          </Card>

          {/* Multiple Delivery Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Delivery Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationInput
                title="Additional Delivery Locations"
                locations={deliveryLocations}
                onChange={setDeliveryLocations}
              />
            </CardContent>
          </Card>

          {/* Load Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Load Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cargoType">Cargo Type *</Label>
                <Input
                  id="cargoType"
                  value={formData.cargoType}
                  onChange={(e) => updateFormData('cargoType', e.target.value)}
                  placeholder="e.g., Electronics, Furniture"
                  required
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight *</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  placeholder="e.g., 15000 lbs"
                  required
                />
              </div>
              <div>
                <Label htmlFor="truckType">Truck Type *</Label>
                <Select value={formData.truckType} onValueChange={(value) => updateFormData('truckType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dry Van">Dry Van</SelectItem>
                    <SelectItem value="Flatbed">Flatbed</SelectItem>
                    <SelectItem value="Reefer">Reefer</SelectItem>
                    <SelectItem value="Box Truck">Box Truck</SelectItem>
                    <SelectItem value="Lowboy">Lowboy</SelectItem>
                    <SelectItem value="Tank Trailer">Tank Trailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pickupTime">Pickup Time</Label>
                <Input
                  id="pickupTime"
                  type="datetime-local"
                  value={formData.pickupTime}
                  onChange={(e) => updateFormData('pickupTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="deliveryTime">Delivery Time</Label>
                <Input
                  id="deliveryTime"
                  type="datetime-local"
                  value={formData.deliveryTime}
                  onChange={(e) => updateFormData('deliveryTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => updateFormData('deadline', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={(e) => updateFormData('additionalNotes', e.target.value)}
                  placeholder="Any special instructions or additional information..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createLoadRequestMutation.isPending}
            >
              {createLoadRequestMutation.isPending ? "Creating..." : "Create Load Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}