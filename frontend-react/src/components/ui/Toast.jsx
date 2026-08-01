import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import useAppStore from '../../store/appStore';

const icons = {
  success: <CheckCircle size={16} className="text-secondary" />,
  error:   <AlertCircle size={16} className="text-danger" />,
  info:    <Info size={16} className="text-primary" />,
};

const toastStyles = {
  success: 'border-secondary-ring bg-secondary-light text-ink',
  error:   'border-danger-ring bg-danger-light text-ink',
  info:    'border-primary-ring bg-primary-light text-ink',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl
              border shadow-card min-w-[280px] max-w-sm
              ${toastStyles[toast.type] || toastStyles.info}
            `}
          >
            {icons[toast.type]}
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="btn-icon w-6 h-6 flex-shrink-0">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
