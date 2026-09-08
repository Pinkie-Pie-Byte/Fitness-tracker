import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function AgbDialog() {
  const [showAgb, setShowAgb] = useState(false);

  return (
    <>
      <footer className="mt-12 pt-8 pb-12 border-t text-center text-muted-foreground flex flex-col items-center justify-center">
        <p
          className="text-sm font-medium cursor-pointer hover:underline hover:text-primary transition-colors"
          onClick={() => setShowAgb(true)}
        >
          AGB - Allgemeine Geschäftsbedingungen
        </p>
      </footer>

      <Dialog open={showAgb} onOpenChange={setShowAgb}>
        <DialogContent className="max-w-4xl border-none bg-transparent shadow-none p-0 flex justify-center">
          <img
            src="/agb-borat.png"
            alt="AGB"
            className="max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
