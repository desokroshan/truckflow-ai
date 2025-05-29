import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Mic2 } from "lucide-react";
import type { LoadRequest } from "@shared/schema";

export default function AIProcessing() {
  const { data: loadRequests = [] } = useQuery<LoadRequest[]>({
    queryKey: ["/api/load-requests"],
  });

  // Get the most recent load request for display
  const latestLoad = loadRequests[0];
  const extractedData = latestLoad?.extractedData ? JSON.parse(latestLoad.extractedData) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">AI Processing Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transcription */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center text-sm font-medium text-slate-900">
              <Mic2 className="w-4 h-4 mr-2 text-blue-500" />
              Transcription (OpenAI Whisper)
            </h4>
            <Badge variant={latestLoad ? "default" : "secondary"}>
              {latestLoad ? "Complete" : "Waiting"}
            </Badge>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            {latestLoad?.transcription ? (
              <p className="text-sm text-slate-700 leading-relaxed">
                "{latestLoad.transcription}"
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No transcription available. Upload an audio file or simulate a call to see results.
              </p>
            )}
          </div>
        </div>

        {/* GPT-4 Extraction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center text-sm font-medium text-slate-900">
              <Brain className="w-4 h-4 mr-2 text-purple-500" />
              Load Information Extraction (GPT-4)
            </h4>
            <Badge variant={extractedData ? "default" : "secondary"}>
              {extractedData ? "Parsed" : "Waiting"}
            </Badge>
          </div>
          
          {extractedData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Pickup Details
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Location:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {extractedData.pickupLocation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Address:</span>
                    <span className="text-sm font-medium text-slate-900 text-right">
                      {extractedData.pickupAddress}
                    </span>
                  </div>
                  {extractedData.pickupTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Time:</span>
                      <span className="text-sm font-medium text-slate-900">
                        {extractedData.pickupTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Delivery Details
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Location:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {extractedData.deliveryLocation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Address:</span>
                    <span className="text-sm font-medium text-slate-900 text-right">
                      {extractedData.deliveryAddress}
                    </span>
                  </div>
                  {extractedData.deliveryTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Time:</span>
                      <span className="text-sm font-medium text-slate-900">
                        {extractedData.deliveryTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500 italic">
                No load information extracted yet. Process an audio file to see extracted details.
              </p>
            </div>
          )}

          {extractedData && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Load Info
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Weight:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {extractedData.weight}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Type:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {extractedData.cargoType}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Equipment
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Trailer:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {extractedData.truckType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Customer:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {extractedData.customerName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
