import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, MapPin } from "lucide-react";
import type { Location } from "@shared/schema";

interface LocationInputProps {
  title: string;
  locations: Location[];
  onChange: (locations: Location[]) => void;
  required?: boolean;
}

export function LocationInput({ title, locations, onChange, required = false }: LocationInputProps) {
  const addLocation = () => {
    const newLocation: Location = {
      id: Date.now().toString(),
      location: "",
      address: "",
      contactName: "",
      contactPhone: "",
      scheduledTime: "",
      instructions: "",
    };
    onChange([...locations, newLocation]);
  };

  const removeLocation = (id: string) => {
    onChange(locations.filter(loc => loc.id !== id));
  };

  const updateLocation = (id: string, field: keyof Location, value: string) => {
    onChange(locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          {title} {required && <span className="text-red-500">*</span>}
        </Label>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={addLocation}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add {title.replace(/s$/, '')}
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MapPin className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">No {title.toLowerCase()} added yet</p>
            <p className="text-gray-400 text-xs">Click "Add {title.replace(/s$/, '')}" to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {locations.map((location, index) => (
            <Card key={location.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {title.replace(/s$/, '')} {index + 1}
                  </CardTitle>
                  {locations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLocation(location.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`location-${location.id}`} className="text-sm">
                      Location Name *
                    </Label>
                    <Input
                      id={`location-${location.id}`}
                      value={location.location}
                      onChange={(e) => updateLocation(location.id, 'location', e.target.value)}
                      placeholder="e.g., Seattle, WA"
                      required={required}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`address-${location.id}`} className="text-sm">
                      Address *
                    </Label>
                    <Input
                      id={`address-${location.id}`}
                      value={location.address}
                      onChange={(e) => updateLocation(location.id, 'address', e.target.value)}
                      placeholder="e.g., 123 Main St, Seattle, WA 98101"
                      required={required}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`contact-name-${location.id}`} className="text-sm">
                      Contact Name
                    </Label>
                    <Input
                      id={`contact-name-${location.id}`}
                      value={location.contactName || ''}
                      onChange={(e) => updateLocation(location.id, 'contactName', e.target.value)}
                      placeholder="Contact person name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`contact-phone-${location.id}`} className="text-sm">
                      Contact Phone
                    </Label>
                    <Input
                      id={`contact-phone-${location.id}`}
                      value={location.contactPhone || ''}
                      onChange={(e) => updateLocation(location.id, 'contactPhone', e.target.value)}
                      placeholder="+1-555-123-4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`scheduled-time-${location.id}`} className="text-sm">
                      Scheduled Time
                    </Label>
                    <Input
                      id={`scheduled-time-${location.id}`}
                      type="datetime-local"
                      value={location.scheduledTime || ''}
                      onChange={(e) => updateLocation(location.id, 'scheduledTime', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`instructions-${location.id}`} className="text-sm">
                    Special Instructions
                  </Label>
                  <Textarea
                    id={`instructions-${location.id}`}
                    value={location.instructions || ''}
                    onChange={(e) => updateLocation(location.id, 'instructions', e.target.value)}
                    placeholder="Special delivery instructions, dock info, etc."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}