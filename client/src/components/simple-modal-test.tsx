import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SimpleModalTest() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold">Modal Test</h3>
      <p>State: {isOpen ? 'OPEN' : 'CLOSED'}</p>
      
      <Button 
        onClick={() => {
          console.log('Test button clicked, setting to true');
          setIsOpen(true);
        }}
        className="bg-blue-600"
      >
        Open Test Modal
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Modal Works!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>This is a simple test modal.</p>
            <p>State inside modal: {isOpen ? 'OPEN' : 'CLOSED'}</p>
            <Button onClick={() => setIsOpen(false)}>Close Modal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}