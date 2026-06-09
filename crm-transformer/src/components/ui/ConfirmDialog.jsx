import React from 'react';
import Modal from './Modal';
import { AlertCircle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', isDanger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`p-3 rounded-full ${isDanger ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-slate-500">{message}</p>
        </div>

        <div className="flex items-center gap-3 w-full mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
