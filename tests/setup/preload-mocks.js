/* Jest preload mocks: Radix Toast mocked to simple div wrappers */

jest.mock('@radix-ui/react-toast', () => {
  const React = require('react');

  const mk = name => {
    const C = React.forwardRef((props, ref) =>
      React.createElement(
        'div',
        { 'data-mock': name, ref, ...props },
        props?.children
      )
    );
    C.displayName = name;
    return C;
  };

  return {
    Provider: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    Toaster: mk('Toaster'),
    Root: mk('ToastRoot'),
    Title: mk('ToastTitle'),
    Description: mk('ToastDescription'),
    Close: mk('ToastClose'),
    Viewport: mk('ToastViewport'),
  };
});

// Robust react-hook-form mock used across tests to avoid JSDOM instanceof issues
jest.mock('react-hook-form', () => {
  const React = require('react');
  const store = { values: {}, listeners: new Set() };
  const notify = () =>
    Array.from(store.listeners).forEach(l => {
      try {
        l();
      } catch {}
    });
  return {
    useForm: () => ({
      control: {},
      handleSubmit: fn => e => fn({ ...store.values }, e),
      reset: vals => {
        if (vals && typeof vals === 'object') {
          store.values = { ...store.values, ...vals };
          notify();
        }
      },
      setValue: (name, value) => {
        store.values[name] = value;
        notify();
      },
      getValues: () => ({ ...store.values }),
      formState: { isValid: true },
    }),
    useWatch: ({ name }) => store.values[name] ?? '',
    useFormContext: () => ({
      getFieldState: () => ({}),
      formState: { isValid: true },
    }),
    Controller: ({ name, render }) => {
      const [, force] = React.useReducer(c => c + 1, 0);
      React.useEffect(() => {
        const l = () => force();
        store.listeners.add(l);
        return () => store.listeners.delete(l);
      }, []);
      return render({
        field: {
          name,
          value: store.values[name] ?? '',
          onChange: e => {
            const next = e && e.target ? e.target.value : e;
            store.values[name] = next;
            notify();
          },
          onBlur: () => {},
          ref: () => {},
        },
      });
    },
    FormProvider: ({ children }) =>
      React.createElement(React.Fragment, null, children),
  };
});
