import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, Settings, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TwilioSetup() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Webhook URL copied successfully",
    });
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';
  const voiceWebhookUrl = `${currentDomain}/api/twilio/voice`;
  const recordingWebhookUrl = `${currentDomain}/api/twilio/recording`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Twilio Phone Integration
          </CardTitle>
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
            Setup Required
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            To receive real phone calls, you need to configure Twilio webhooks. Follow the steps below to complete the setup.
          </AlertDescription>
        </Alert>

        {/* Step 1: Twilio Account */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Step 1: Get Twilio Credentials</h4>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">1. Create a Twilio account</span>
              <Button size="sm" variant="outline" asChild>
                <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Twilio Console
                </a>
              </Button>
            </div>
            <div className="text-sm text-slate-600">
              2. Purchase a phone number with Voice capabilities
            </div>
            <div className="text-sm text-slate-600">
              3. Get your Account SID, Auth Token, and Phone Number
            </div>
          </div>
        </div>

        {/* Step 2: Add Secrets */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Step 2: Add Twilio Secrets</h4>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="text-sm text-slate-600">
              In your Replit Secrets tab, add these environment variables:
            </div>
            <div className="grid grid-cols-1 gap-2 font-mono text-xs">
              <div className="bg-white p-2 rounded border">
                <strong>TWILIO_ACCOUNT_SID</strong> = your_account_sid_here
              </div>
              <div className="bg-white p-2 rounded border">
                <strong>TWILIO_AUTH_TOKEN</strong> = your_auth_token_here  
              </div>
              <div className="bg-white p-2 rounded border">
                <strong>TWILIO_PHONE_NUMBER</strong> = +1234567890
              </div>
              <div className="bg-white p-2 rounded border">
                <strong>OWNER_EMAIL</strong> = your_email@company.com
              </div>
              <div className="bg-white p-2 rounded border">
                <strong>OWNER_PHONE</strong> = +1234567890
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Configure Webhooks */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Step 3: Configure Phone Number Webhooks</h4>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="text-sm text-slate-600">
              In your Twilio Console, go to Phone Numbers → Manage → Active numbers → [Your Number]
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Voice Webhook URL:</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={voiceWebhookUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(voiceWebhookUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-slate-500">
                Set this as your Voice webhook URL (HTTP POST)
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Test */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Step 4: Test Your Setup</h4>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Ready to Test</span>
            </div>
            <div className="text-sm text-green-700">
              Once configured, customers can call your Twilio number and the AI will:
            </div>
            <ul className="text-sm text-green-700 mt-2 ml-4 space-y-1">
              <li>• Greet them with a professional message</li>
              <li>• Record their shipping requirements</li>
              <li>• Process the audio with AI to extract load details</li>
              <li>• Send you email and SMS notifications for approval</li>
              <li>• Display the request in your dashboard</li>
            </ul>
          </div>
        </div>

        {/* Current Status */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-slate-900 mb-3">Current Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Voice Webhook Endpoint</span>
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                Ready
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Recording Webhook Endpoint</span>
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                Ready
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">AI Processing Pipeline</span>
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                Ready
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Twilio Credentials</span>
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                Needs Setup
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}