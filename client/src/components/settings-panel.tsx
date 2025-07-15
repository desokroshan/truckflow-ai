import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, MessageSquare, Save } from "lucide-react";
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
  const queryClient = useQueryClient();

  // Fetch greeting message setting
  const { data: greetingSetting, isLoading } = useQuery({
    queryKey: ["settings", "greeting_message"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/settings/greeting_message", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Setting doesn't exist yet
        }
        throw new Error("Failed to fetch greeting message");
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        setGreetingMessage(data.value);
      }
    },
  });

  // Update greeting message mutation
  const updateGreetingMutation = useMutation({
    mutationFn: async (message: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: "greeting_message",
          value: message,
          description: "Customizable greeting message for incoming calls",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update greeting message");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Greeting message has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["settings", "greeting_message"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleSaveGreeting = () => {
    if (greetingMessage.trim()) {
      updateGreetingMutation.mutate(greetingMessage.trim());
    }
  };

  const resetToDefault = () => {
    const defaultMessage = "Thank you for calling Expedite Transport. I'm your AI assistant and I'll help you with your shipping request. Please describe your shipping needs including pickup location, delivery location, cargo type, and any special requirements. I'll be recording this call to process your request.";
    setGreetingMessage(defaultMessage);
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
          <div className="space-y-6">
            {/* Greeting Message Settings */}
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
                    rows={6}
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    placeholder="Enter your custom greeting message..."
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This message will be played when customers call your Twilio number.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleSaveGreeting}
                    disabled={!greetingMessage.trim() || updateGreetingMutation.isPending}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateGreetingMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={resetToDefault}
                  >
                    Reset to Default
                  </Button>
                </div>

                {greetingSetting && (
                  <div className="text-sm text-gray-500 mt-4">
                    Last updated: {new Date(greetingSetting.updatedAt).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Future Settings Can Be Added Here */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  More customization options will be added here in future updates.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}