export function useAuth() {
  const getToken = () => localStorage.getItem("token");
  const setToken = (t: string) => localStorage.setItem("token", t);
  const clearToken = () => localStorage.removeItem("token");
  const isAuthenticated = () => !!getToken();
  return { getToken, setToken, clearToken, isAuthenticated };
}
