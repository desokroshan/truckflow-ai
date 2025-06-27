
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface VoiceAssistantProps {
  onCommand?: (command: string) => void;
}

export default function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);

        // Check for wake word "Franky"
        if (fullTranscript.toLowerCase().includes('franky') && !isActivated) {
          setIsActivated(true);
          speak("Sure I will help you with that");
          toast({
            title: "Franky Activated",
            description: "Voice assistant is now listening",
          });
          
          // Auto-deactivate after 10 seconds
          setTimeout(() => {
            setIsActivated(false);
          }, 10000);
        }

        // Process commands when activated
        if (isActivated && finalTranscript && onCommand) {
          onCommand(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Voice Error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        if (isListening) {
          // Restart recognition if it stops unexpectedly
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, isActivated, onCommand, toast]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setIsActivated(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      toast({
        title: "Listening Started",
        description: "Say 'Franky' to activate the voice assistant",
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            Voice Assistant (Franky)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-slate-600">Speech recognition is not supported in this browser.</p>
            <p className="text-sm text-slate-500 mt-2">
              Try using Chrome, Edge, or Safari for voice features.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            Voice Assistant (Franky)
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isActivated && (
              <Badge variant="default" className="bg-green-500">
                <Volume2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
            <Badge variant={isListening ? "destructive" : "secondary"}>
              {isListening ? "Listening" : "Stopped"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="flex items-center space-x-2"
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Start Listening</span>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Instructions:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Click "Start Listening" to begin</li>
              <li>• Say "Franky" to activate the assistant</li>
              <li>• Franky will respond: "Sure I will help you with that"</li>
              <li>• Assistant stays active for 10 seconds after activation</li>
            </ul>
          </div>

          {transcript && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Last Heard:</h4>
              <p className="text-sm text-blue-600">"{transcript}"</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
