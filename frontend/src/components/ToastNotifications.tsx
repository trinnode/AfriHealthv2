/**
 * Toast Notification System
 * Wrapper around react-toastify with custom styling
 */

import { ToastContainer, toast, type ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'dark',
};

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    ...defaultOptions,
    ...options,
    className: 'bg-gray-900 border border-afrihealth-green',
  });
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    ...defaultOptions,
    ...options,
    className: 'bg-gray-900 border border-afrihealth-red',
  });
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    ...defaultOptions,
    ...options,
    className: 'bg-gray-900 border border-afrihealth-orange',
  });
};

export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    ...defaultOptions,
    ...options,
    className: 'bg-gray-900 border border-yellow-500',
  });
};

/**
 * Toast Container Component
 * Add this once at the root of your app
 */
export function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      className="bg-gray-900 border-2 rounded-xl"
    />
  );
}
