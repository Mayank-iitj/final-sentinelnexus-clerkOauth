export const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || "https://sentinelnexus-backend.onrender.com/api/v1";

export const buildApiUrl = (path: string) => `${getApiBaseUrl()}${path}`;