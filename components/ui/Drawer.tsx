import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XIcon } from '../icons/Icons';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const drawerClasses = `fixed top-0 right-0 h-full bg-surface shadow-2xl z-40 transform transition-transform duration-300 ease-in-out w-full max-w-md ${
    isOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  return ReactDOM.createPortal(
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose}></div>}
      <div className={drawerClasses}>
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-surface2">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-surface2">
              <XIcon />
            </button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default Drawer;
