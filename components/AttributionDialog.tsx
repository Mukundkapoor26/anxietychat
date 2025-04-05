import { useState } from 'react';
import { Heart, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttributionDialogProps {
  showOnWelcomePage?: boolean;
}

export default function AttributionDialog({ showOnWelcomePage = false }: AttributionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!showOnWelcomePage) return null;

  return (
    <>
      {/* Attribution Button - Transparent pill */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white shadow-lg hover:bg-white/20 transition-colors duration-200 z-50 border border-white/20 text-xs sm:text-sm"
        aria-label="About AnxietyChat"
      >
        <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="whitespace-nowrap">Created with love by Mukund</span>
      </button>

      {/* Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#4A6741]/95 rounded-xl max-w-sm w-full p-8 relative shadow-xl border border-white/10">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="text-white/90 text-sm leading-relaxed">
                <p className="mb-4">
                  Dear Friend,
                </p>

                <p className="mb-4">
                  I'm Mukund Kapoor, and I created AnxietyChat to help you find comfort and support during difficult times because I know how it feels when you feel alone and have no one to talk to.
                </p>

                <p className="mb-4">
                  I'm committed to keeping this free for as long as I can. Currently, you can use it for up to 20 messages per day, and your limit will refresh automatically the next day. As it grows, I will increase these limits and make it even better.
                </p>

                <p className="mb-4">
                  If AnxietyChat has helped you and you'd like to support its development, any contribution would mean the world to me. It will help cover the costs and allow me to keep improving this service.

                  But remember, AnxietyChat is not a replacement for professional help. If you're feeling overwhelmed, please seek support from a qualified mental health professional, as AI is not a substitute for human interaction.
                </p>

                <div className="my-6">
                  <a
                    href="https://buymeacoffee.com/mukundkapoor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "block w-full text-center py-2 px-4 rounded-lg",
                      "bg-white/10 text-white font-medium",
                      "hover:bg-white/20 transition-colors duration-200",
                      "border border-white/20 text-sm"
                    )}
                  >
                    Support AnxietyChat
                  </a>
                </div>

                <p className="mb-4">
                  Thank you for being here. Wishing you peace and strength on your journey.
                </p>

                <p>
                  With love,<br />
                  Mukund Kapoor
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 