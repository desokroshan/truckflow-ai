import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, MessageSquare, Save, Bot, Phone, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

export default function SettingsPanel() {
  const [greetingMessage, setGreetingMessage] = useState("");
  const [successResponse, setSuccessResponse] = useState("");
  const [errorResponse, setErrorResponse] = useState("");
  const [aiExtractionPrompt, setAiExtractionPrompt] = useState("");
  const [aiSummaryPrompt, setAiSummaryPrompt] = useState("");
  const queryClient = useQueryClient();

  // Fetch all settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      return response.json();
    },
  });

  // Update state when settings data changes
  React.useEffect(() => {
    if (settings) {
      const greetingSetting = settings.find((s: Setting) => s.key === "greeting_message");
      const successSetting = settings.find((s: Setting) => s.key === "success_response");
      const errorSetting = settings.find((s: Setting) => s.key === "error_response");
      const extractionSetting = settings.find((s: Setting) => s.key === "ai_extraction_prompt");
      const summarySetting = settings.find((s: Setting) => s.key === "ai_summary_prompt");
      
      if (greetingSetting) setGreetingMessage(greetingSetting.value);
      if (successSetting) setSuccessResponse(successSetting.value);
      if (errorSetting) setErrorResponse(errorSetting.value);
      if (extractionSetting) setAiExtractionPrompt(extractionSetting.value);
      if (summarySetting) setAiSummaryPrompt(summarySetting.value);
    }
  }, [settings]);

  // Generic setting update mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/settings/${key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value, description }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${key} setting`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Settings Updated",
        description: `${variables.key.replace(/_/g, ' ')} has been updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error, variables) => {
      toast({
        title: "Update Failed",
        description: `Failed to update ${variables.key}: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveSetting = (key: string, value: string, description: string) => {
    if (value.trim()) {
      updateSettingMutation.mutate({ key, value: value.trim(), description });
    }
  };

  const resetToDefaults = () => {
    setGreetingMessage("Thank you for calling Expedite Transport! Please describe your shipping needs - pickup location, delivery location, and cargo details. Press pound when finished or wait 3 seconds after speaking.");
    setSuccessResponse("Got it! Processing your load request now. You'll receive confirmation within 10 minutes. Thank you!");
    setErrorResponse("I'm sorry, I didn't get that clearly. Please call back and speak clearly about your pickup location, delivery location, and cargo type. Thank you!");
    setAiExtractionPrompt(`Extract load information from this text and return valid JSON with these fields:
customerName, customerPhone, pickupLocation, pickupAddress, pickupContactName, 
pickupContactPhone, deliveryLocation, deliveryAddress, cargoType, weight, truckType, 
pickupTime, deliveryTime, deadline, additionalNotes.

NEW: Also extract additional pickup/delivery locations as arrays:
- additionalPickups: Array of {location, address, contactName, contactPhone, scheduledTime, instructions}  
- additionalDeliveries: Array of {location, address, contactName, contactPhone, scheduledTime, instructions}

Extract actual phone numbers if mentioned. If no phone number is provided, use caller ID if available.
Be precise and concise. Use "Not specified" for missing data. Empty arrays if no additional stops.`);
    setAiSummaryPrompt("Create concise load summary for trucking company owner. Include key details: customer, route, cargo, urgency.");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold">
            <Settings className="w-5 h-5 mr-2" />
            Application Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="voice" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="voice" className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Voice Assistant
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center">
                <Bot className="w-4 h-4 mr-2" />
                AI Prompts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-6 mt-6">
              {/* Greeting Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Call Greeting Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="greeting-message">
                      Customize the greeting message for incoming calls
                    </Label>
                    <textarea
                      id="greeting-message"
                      className="w-full mt-2 p-3 border border-gray-300 rounded-md resize-none"
                      rows={4}
                      value={greetingMessage}
                      onChange={(e) => setGreetingMessage(e.target.value)}
                      placeholder="Enter your custom greeting message..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      This message will be played when customers call your Twilio number.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleSaveSetting("greeting_message", greetingMessage, "Voice assistant greeting message for phone calls")}
                    disabled={!greetingMessage.trim() || updateSettingMutation.isPending}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateSettingMutation.isPending ? "Saving..." : "Save Greeting"}
                  </Button>
                </CardContent>
              </Card>

              {/* Success Response */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Success Response
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="success-response">
                      Message played after successfully recording a load request
                    </Label>
                    <textarea
                      id="success-response"
                      className="w-full mt-2 p-3 border border-gray-300 rounded-md resize-none"
                      rows={3}
                      value={successResponse}
                      onChange={(e) => setSuccessResponse(e.target.value)}
                      placeholder="Enter success response message..."
                    />
                  </div>
                  <Button
                    onClick={() => handleSaveSetting("success_response", successResponse, "Success message after recording load request")}
                    disabled={!successResponse.trim() || updateSettingMutation.isPending}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Success Message
                  </Button>
                </CardContent>
              </Card>

              {/* Error Response */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Error Response
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="error-response">
                      Message played when processing fails
                    </Label>
                    <textarea
                      id="error-response"
                      className="w-full mt-2 p-3 border border-gray-300 rounded-md resize-none"
                      rows={3}
                      value={errorResponse}
                      onChange={(e) => setErrorResponse(e.target.value)}
                      placeholder="Enter error response message..."
                    />
                  </div>
                  <Button
                    onClick={() => handleSaveSetting("error_response", errorResponse, "Error message when processing fails")}
                    disabled={!errorResponse.trim() || updateSettingMutation.isPending}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Error Message
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6 mt-6">
              {/* AI Extraction Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Bot className="w-5 h-5 mr-2" />
                    Load Information Extraction Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-extraction-prompt">
                      AI prompt for extracting load information from voice calls, SMS, and emails
                    </Label>
                    <textarea
                      id="ai-extraction-prompt"
                      className="w-full mt-2 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm"
                      rows={12}
                      value={aiExtractionPrompt}
                      onChange={(e) => setAiExtractionPrompt(e.target.value)}
                      placeholder="Enter AI extraction prompt..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      This prompt guides the AI to extract structured shipping data from unstructured text.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleSaveSetting("ai_extraction_prompt", aiExtractionPrompt, "AI prompt for extracting load information from text")}
                    disabled={!aiExtractionPrompt.trim() || updateSettingMutation.isPending}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Extraction Prompt
                  </Button>
                </CardContent>
              </Card>

              {/* AI Summary Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Load Summary Generation Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-summary-prompt">
                      AI prompt for generating concise load summaries for notifications
                    </Label>
                    <textarea
                      id="ai-summary-prompt"
                      className="w-full mt-2 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm"
                      rows={4}
                      value={aiSummaryPrompt}
                      onChange={(e) => setAiSummaryPrompt(e.target.value)}
                      placeholder="Enter AI summary prompt..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      This prompt creates brief summaries for owner notifications and dashboard displays.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleSaveSetting("ai_summary_prompt", aiSummaryPrompt, "AI prompt for generating load summaries")}
                    disabled={!aiSummaryPrompt.trim() || updateSettingMutation.isPending}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Summary Prompt
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reset to Defaults */}
            <div className="flex justify-between items-center pt-6 border-t">
              <p className="text-sm text-gray-500">
                Reset all settings to their default values
              </p>
              <Button
                variant="outline"
                onClick={resetToDefaults}
                disabled={updateSettingMutation.isPending}
              >
                Reset All to Defaults
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}