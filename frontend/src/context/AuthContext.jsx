import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext();


const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  /*
   * ============================================================
   * SAVE AUTH DATA
   * ============================================================
   */
  const saveAuthData = (data) => {
    if (data.accessToken) {
      localStorage.setItem(
        "accessToken",
        data.accessToken
      );
    }

    if (data.refreshToken) {
      localStorage.setItem(
        "refreshToken",
        data.refreshToken
      );
    }

    if (data.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setUser(data.user);
    }
  };


  /*
   * ============================================================
   * LOGIN
   * ============================================================
   */
  const login = async (
    email,
    password
  ) => {
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    saveAuthData(response.data);

    return response.data;
  };


  /*
   * ============================================================
   * SIGNUP
   * ============================================================
   */
  const signup = async (
    name,
    email,
    password
  ) => {
    const response = await api.post(
      "/auth/signup",
      {
        name,
        email,
        password,
      }
    );

    saveAuthData(response.data);

    return response.data;
  };


  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */
  const logout = async () => {
    const refreshToken =
      localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await api.post(
          "/auth/logout",
          {
            refreshToken,
          }
        );
      }
    } catch (error) {
      console.error(
        "Logout API error:",
        error
      );
    }

    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "refreshToken"
    );

    localStorage.removeItem(
      "user"
    );

    setUser(null);
  };


  /*
   * ============================================================
   * RESTORE SESSION
   * ============================================================
   *
   * When the application starts:
   *
   * 1. Try existing access token.
   * 2. If expired, api.js automatically refreshes it.
   * 3. /auth/me is retried automatically.
   * 4. User stays logged in.
   */
  useEffect(() => {
    const restoreUser = async () => {

      const accessToken =
        localStorage.getItem(
          "accessToken"
        );

      const refreshToken =
        localStorage.getItem(
          "refreshToken"
        );


      /*
       * No tokens at all.
       */
      if (
        !accessToken &&
        !refreshToken
      ) {
        setLoading(false);
        return;
      }


      try {

        /*
         * If an access token exists,
         * attach it immediately.
         */
        if (accessToken) {
          api.defaults.headers.common.Authorization =
            `Bearer ${accessToken}`;
        }


        /*
         * /auth/me will use the access token.
         *
         * If it is expired, api.js response
         * interceptor automatically calls:
         *
         * POST /auth/refresh
         *
         * and retries this request.
         */
        const response =
          await api.get("/auth/me");


        const restoredUser =
          response.data.user;


        /*
         * Save the latest user information.
         */
        if (restoredUser) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              restoredUser
            )
          );

          setUser(
            restoredUser
          );
        }

      } catch (error) {

        console.error(
          "Restore session error:",
          error
        );


        /*
         * Only clear the session if
         * authentication genuinely failed.
         */
        localStorage.removeItem(
          "accessToken"
        );

        localStorage.removeItem(
          "refreshToken"
        );

        localStorage.removeItem(
          "user"
        );

        setUser(null);

      } finally {
        setLoading(false);
      }
    };


    restoreUser();

  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export { AuthProvider };

export const useAuth = () => {
  return useContext(AuthContext);
};