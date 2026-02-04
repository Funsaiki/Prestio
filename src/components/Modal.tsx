import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ isOpen, title, onClose, children, footer, size = 'md' }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState<'in' | 'out'>('in');
  const closingRef = useRef(false);

  useEffect(() => {
    if (isOpen && !isVisible) {
      // Ouverture
      setIsVisible(true);
      setAnimationClass('in');
      closingRef.current = false;
    } else if (!isOpen && isVisible && !closingRef.current) {
      // Fermeture déclenchée par le parent
      closingRef.current = true;
      setAnimationClass('out');
      setTimeout(() => {
        setIsVisible(false);
        closingRef.current = false;
      }, 250);
    }
  }, [isOpen, isVisible]);

  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setAnimationClass('out');
    setTimeout(() => {
      setIsVisible(false);
      closingRef.current = false;
      onClose();
    }, 250);
  };

  if (!isVisible) return null;

  const containerClass = animationClass === 'in' ? 'animate-fade-in' : 'animate-fade-out';
  const modalClass = animationClass === 'in' ? 'animate-scale-in' : 'animate-scale-out';

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${containerClass}`}>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] flex flex-col ${modalClass}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h3 className="font-elegant text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
