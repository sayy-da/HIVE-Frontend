import * as Sentry from "@sentry/react";

export const initSentry = () => {
  if (import.meta.env.MODE === "development") return;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0, // optional, adjust in production
  });
};

export { Sentry };
