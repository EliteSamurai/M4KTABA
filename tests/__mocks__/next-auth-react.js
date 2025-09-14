// CommonJS-style mock for next-auth/react
console.log('Loading next-auth/react mock');

const useSession = () => {
  console.log('useSession mock called');
  return {
    data: { user: { id: 'test-user', _id: 'test-user' } },
    status: 'authenticated',
  };
};

const signIn = jest.fn();
const signOut = jest.fn();
const getCsrfToken = async () => 'test-csrf';

module.exports = { useSession, signIn, signOut, getCsrfToken };
module.exports.useSession = useSession;
module.exports.signIn = signIn;
module.exports.signOut = signOut;
module.exports.getCsrfToken = getCsrfToken;
