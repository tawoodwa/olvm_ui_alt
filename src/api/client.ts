import axios, { type AxiosRequestConfig } from 'axios';

const username = import.meta.env.VITE_OVIRT_USER as string | undefined;
const password = import.meta.env.VITE_OVIRT_PASSWORD as string | undefined;

if (!username || !password) {
  console.warn('OVIRT credentials are not set in .env.local (VITE_OVIRT_USER / VITE_OVIRT_PASSWORD)');
}

const authClient = axios.create({
  baseURL: '/ovirt-engine',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  },
});

let accessToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

async function fetchToken(): Promise<string> {
  if (!username || !password) {
    throw new Error('OVIRT credentials not configured');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('scope', 'ovirt-app-api');
  params.append('username', username);
  params.append('password', password);

  const response = await authClient.post('/sso/oauth/token', params);
  const token = response.data.access_token as string | undefined;

  if (!token) {
    throw new Error('No access_token returned from OLVM');
  }

  return token;
}

async function ensureToken(): Promise<string> {
  if (accessToken) {
    return accessToken;
  }

  if (!tokenPromise) {
    tokenPromise = fetchToken()
      .then((token) => {
        accessToken = token;
        tokenPromise = null;
        return token;
      })
      .catch((err) => {
        tokenPromise = null;
        accessToken = null;
        throw err;
      });
  }

  return tokenPromise;
}

export const apiClient = axios.create({
  baseURL: '/ovirt-engine/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const token = await ensureToken();
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);
