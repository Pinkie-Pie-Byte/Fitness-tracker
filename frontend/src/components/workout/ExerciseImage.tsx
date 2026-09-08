import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ExerciseImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ExerciseImage({
  src,
  alt,
  className = 'w-8 h-8 object-cover rounded'
}: ExerciseImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${className} cursor-pointer hover:opacity-85 transition-all hover:scale-105 hover:ring-2 hover:ring-primary/40 active:scale-95`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title="Klicken zum Vergrößern"
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-xl border border-border bg-card/95 backdrop-blur-md p-4 flex flex-col items-center justify-center rounded-2xl shadow-2xl"
          showCloseButton={true}
        >
          <DialogTitle className="text-base font-semibold text-center mb-2">
            {alt}
          </DialogTitle>
          <img
            src={src}
            alt={alt}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-md"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
