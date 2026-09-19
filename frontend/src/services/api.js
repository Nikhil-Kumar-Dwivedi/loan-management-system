import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * ============================================================
 * REQUEST INTERCEPTOR
 * ============================================================
 *
 * Automatically attach the current access token
 * to every protected API request.
 */
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


/*
 * ============================================================
 * RESPONSE INTERCEPTOR
 * ============================================================
 *
 * If the access token expires:
 *
 * 1. API returns 401
 * 2. Send refresh token to /auth/refresh
 * 3. Save new access + refresh tokens
 * 4. Retry the original request
 *
 * The user does NOT need to login again.
 */
let isRefreshing = false;

let refreshSubscribers = [];


/*
 * Add requests to the waiting queue while
 * another request is refreshing the token.
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};


/*
 * Resolve all requests waiting for
 * the new access token.
 */
const onRefreshed = (newAccessToken) => {
  refreshSubscribers.forEach((callback) => {
    callback(newAccessToken);
  });

  refreshSubscribers = [];
};


/*
 * If refresh itself fails, reject all
 * waiting requests.
 */
const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((callback) => {
    callback(null, error);
  });

  refreshSubscribers = [];
};


api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    /*
     * Only handle 401 errors.
     */
    if (
      error.response?.status !== 401 ||
      !originalRequest
    ) {
      return Promise.reject(error);
    }


    /*
     * Never try to refresh the token when
     * the failed request itself is /auth/refresh.
     *
     * Otherwise we could create an infinite loop.
     */
    if (
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }


    /*
     * Prevent the same request from
     * refreshing repeatedly.
     */
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;


    const refreshToken =
      localStorage.getItem("refreshToken");


    /*
     * No refresh token means the session
     * cannot be renewed.
     */
    if (!refreshToken) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      window.location.href = "/login";

      return Promise.reject(error);
    }


    /*
     * If another request is already refreshing
     * the token, wait for that refresh to finish.
     */
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          (newAccessToken, refreshError) => {
            if (refreshError || !newAccessToken) {
              reject(
                refreshError || error
              );
              return;
            }

            originalRequest.headers.Authorization =
              `Bearer ${newAccessToken}`;

            resolve(
              api(originalRequest)
            );
          }
        );
      });
    }


    /*
     * This request becomes responsible
     * for refreshing the token.
     */
    isRefreshing = true;


    try {
      const refreshResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {
          refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );


      const newAccessToken =
        refreshResponse.data.accessToken;

      const newRefreshToken =
        refreshResponse.data.refreshToken;


      /*
       * Backend rotates both tokens,
       * so save BOTH of them.
       */
      localStorage.setItem(
        "accessToken",
        newAccessToken
      );

      if (newRefreshToken) {
        localStorage.setItem(
          "refreshToken",
          newRefreshToken
        );
      }


      /*
       * Tell all waiting requests
       * that the new token is ready.
       */
      onRefreshed(newAccessToken);


      /*
       * Retry the original failed request
       * with the fresh access token.
       */
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);

    } catch (refreshError) {

      /*
       * Refresh token itself is invalid/expired.
       * At this point the user genuinely needs
       * to login again.
       */
      onRefreshFailed(refreshError);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      window.location.href = "/login";

      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);


export default api;