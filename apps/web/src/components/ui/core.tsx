"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

const animationsStyle = `
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .anim-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .anim-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  .anim-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
`;

// --- MODAL ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
      <style>{animationsStyle}</style>
      <div className="fixed inset-0 bg-onyx/40 backdrop-blur-sm anim-fade-in" onClick={onClose} />
      <div className="relative bg-pearl rounded-xl shadow-xl w-full max-w-md border border-oatmeal flex flex-col max-h-[90vh] anim-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-oatmeal">
          <h2 className="text-lg font-semibold text-onyx">{title}</h2>
          <button onClick={onClose} className="text-stone hover:text-onyx hover:rotate-90 transition-all duration-300 rounded-md hover:bg-oatmeal/50 p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- DRAWER ---
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <style>{animationsStyle}</style>
      <div className="fixed inset-0 bg-onyx/40 backdrop-blur-sm anim-fade-in" onClick={onClose} />
      <div className="relative w-full sm:w-[450px] h-full bg-pearl shadow-2xl border-l border-oatmeal flex flex-col anim-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b border-oatmeal">
          <h2 className="text-xl font-semibold text-onyx">{title}</h2>
          <button onClick={onClose} className="text-stone hover:text-onyx hover:rotate-90 transition-all duration-300 rounded-md hover:bg-oatmeal/50 p-1">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- FORM FIELD ---
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  as?: "input" | "textarea";
}
export function FormField({ label, error, as = "input", className = "", ...props }: FormFieldProps) {
  const Component = as as any;
  return (
    <div className="flex flex-col gap-1.5 w-full mb-4">
      <label className="text-sm font-semibold text-onyx">{label} {props.required && <span className="text-crimson">*</span>}</label>
      <Component 
        {...props} 
        className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-colors bg-white text-onyx placeholder:text-stone/50 ${error ? 'border-crimson focus:border-crimson' : 'border-oatmeal focus:border-forest hover:border-forest/30'} ${className}`} 
      />
      {error && <span className="text-xs font-medium text-crimson mt-0.5">{error}</span>}
    </div>
  );
}

// --- DATE INPUT ---
export function DateInput({ label, error, ...props }: Omit<FormFieldProps, "as">) {
  return (
    <FormField label={label} error={error} type="date" {...props} />
  );
}

// --- CURRENCY INPUT ---
export function CurrencyInput({ label, error, ...props }: Omit<FormFieldProps, "as" | "type">) {
  return (
    <div className="flex flex-col gap-1.5 w-full mb-4">
      <label className="text-sm font-semibold text-onyx">{label} {props.required && <span className="text-crimson">*</span>}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone font-medium">₹</span>
        <input 
          type="number"
          step="0.01"
          {...props} 
          className={`w-full pl-8 pr-4 py-2.5 border rounded-lg outline-none transition-colors bg-white text-onyx placeholder:text-stone/50 ${error ? 'border-crimson focus:border-crimson' : 'border-oatmeal focus:border-forest hover:border-forest/30'}`} 
        />
      </div>
      {error && <span className="text-xs font-medium text-crimson mt-0.5">{error}</span>}
    </div>
  );
}

// --- SELECT ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string, label: string }[];
}
export function Select({ label, error, options, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full mb-4">
      <label className="text-sm font-semibold text-onyx">{label} {props.required && <span className="text-crimson">*</span>}</label>
      <select 
        {...props} 
        className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-colors bg-white text-onyx appearance-none cursor-pointer ${error ? 'border-crimson focus:border-crimson' : 'border-oatmeal focus:border-forest hover:border-forest/30'}`}
        style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236A6A65\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
      >
        <option value="" disabled>Select an option</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="text-xs font-medium text-crimson mt-0.5">{error}</span>}
    </div>
  );
}

// --- CONFIRM DIALOG ---
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}
export function ConfirmDialog({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, isDestructive = false }: ConfirmDialogProps) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-stone mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-onyx font-medium border border-oatmeal rounded-lg hover:bg-onyx/5 transition-colors">
          {cancelText}
        </button>
        <button onClick={onConfirm} className={`px-4 py-2 text-white font-medium rounded-lg transition-colors ${isDestructive ? 'bg-[#8A3C3C] hover:bg-[#8A3C3C]/90' : 'bg-forest hover:bg-forest-dark'}`}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

// --- TOAST ---
type ToastType = 'success' | 'error' | 'info';
export const useToast = () => {
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ToastComponent = () => {
    if (!toast) return null;
    return (
      <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-lg border ${
          toast.type === 'success' ? 'bg-forest text-white border-[#2E3A32]' : 
          toast.type === 'error' ? 'bg-[#8A3C3C] text-white border-[#6c2e2e]' : 
          'bg-white text-onyx border-oatmeal'
        }`}>
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <AlertTriangle size={18} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      </div>
    );
  };

  return { showToast, ToastComponent };
};
