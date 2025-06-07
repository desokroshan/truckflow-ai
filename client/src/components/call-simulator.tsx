import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Upload, Mic } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CallSimulator() {
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: "ABC Logistics Inc.",
    phone: "+1 (555) 123-4567"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const simulateCallMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; customerName: string }) => {
      return await apiRequest("POST", "/api/simulate-call", data);
    },
    onSuccess: () => {
      setCallActive(true);
      setCallDuration(0);

      // Simulate call duration counter
      const interval = setInterval(() => {
        setCallDuration(prev => {
          if (prev >= 120) { // End call after 2 minutes
            clearInterval(interval);
            setCallActive(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      toast({
        title: "Call Simulation Started",
        description: "AI agent is handling the customer inquiry",
      });

      // Invalidate queries to refresh data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/load-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      }, 5000);
    },
    onError: (error) => {
      toast({
        title: "Call Simulation Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const uploadAudioMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('audio', file);

      return await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
    },
    onSuccess: async (response) => {
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Audio Processed Successfully",
          description: "Load information extracted and notifications sent",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/load-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      } else {
        throw new Error('Failed to process audio');
      }
    },
    onError: (error) => {
      toast({
        title: "Audio Processing Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleCallAction = () => {
    if (callActive) {
      setCallActive(false);
      setCallDuration(0);
      toast({
        title: "Call Ended",
        description: "Call simulation terminated",
      });
    } else {
      simulateCallMutation.mutate({
        phoneNumber: customerInfo.phone,
        customerName: customerInfo.name,
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAudioMutation.mutate(file);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Audio Processing</CardTitle>
          <Badge variant={callActive ? "destructive" : "secondary"}>
            {callActive ? "Live" : "Ready"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone Interface */}
        <div className="bg-slate-50 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              callActive ? 'bg-green-500' : 'bg-primary'
            }`}>
              <Phone className="text-white text-2xl" />
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-lg font-medium text-slate-900 mb-2">
              {callActive ? "Call in Progress" : "Incoming Call"}
            </p>
            <div className="space-y-1">
              <Input
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                className="text-center"
                disabled={callActive}
              />
              <Input
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
                className="text-center"
                disabled={callActive}
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4 mb-6">
            <Button
              onClick={handleCallAction}
              disabled={simulateCallMutation.isPending}
              className={`w-16 h-16 rounded-full ${
                callActive 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {callActive ? (
                <PhoneOff className="text-xl" />
              ) : (
                <Phone className="text-xl" />
              )}
            </Button>
          </div>

          {/* Call Status */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Call Duration</span>
              <span className="text-sm font-mono text-slate-900">{formatDuration(callDuration)}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-600">Status</span>
              <Badge variant={callActive ? "default" : "secondary"}>
                {callActive ? "Processing" : "Idle"}
              </Badge>
            </div>
            {callActive && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">Audio Level:</span>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary animate-pulse"
                      style={{
                        height: `${Math.random() * 16 + 8}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audio Upload for Testing */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
          <div className="text-center">
            <Mic className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h4 className="text-lg font-medium text-slate-900 mb-2">Test Audio Upload</h4>
            <p className="text-slate-600 mb-4">Upload audio samples to test transcription and extraction</p>
            <div className="flex items-center justify-center">
              <Label htmlFor="audioUpload" className="cursor-pointer">
                <div className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Audio File
                </div>
                <Input
                  id="audioUpload"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadAudioMutation.isPending}
                />
              </Label>
            </div>
            <p className="text-xs text-slate-500 mt-2">Supports MP3, WAV, M4A (max 25MB)</p>
            {uploadAudioMutation.isPending && (
              <div className="mt-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-2 bg-slate-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2">Processing audio...</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}