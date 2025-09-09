// ESM-style mock for next-auth/react
export const useSession = () => ({
  data: { user: { id: "test-user", _id: "test-user" } },
  status: "authenticated",
});
export const signIn = jest.fn();
export const signOut = jest.fn();
export const getCsrfToken = async () => "test-csrf";
export default { useSession, signIn, signOut, getCsrfToken };
