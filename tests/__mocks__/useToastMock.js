const { fn } = require('jest-mock');
const toastMock = fn();
module.exports = {
  __esModule: true,
  useToast: () => ({ toast: toastMock }),
  toastMock,
};
