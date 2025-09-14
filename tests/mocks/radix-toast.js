// Minimal CommonJS stub
const ToastProvider = ({ children }) => children;
const ToastViewport = () => null;
const Toast = ({ children }) => children ?? null;
const ToastTitle = ({ children }) => children ?? null;
const ToastDescription = ({ children }) => children ?? null;
const ToastAction = ({ children }) => children ?? null;
const ToastClose = () => null;

module.exports = {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
};
