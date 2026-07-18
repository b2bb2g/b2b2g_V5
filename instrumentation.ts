import type { Instrumentation } from "next";

// Server-side error capture: every uncaught request error lands in
// app_error_logs (viewable in the admin security console).
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
) => {
  const { persistErrorLog } = await import("@/lib/error-log");
  const err = error as { message?: string; stack?: string };
  await persistErrorLog({
    source: "server",
    message: err?.message ?? String(error),
    stack: err?.stack ?? null,
    url: request.path,
    userAgent: request.headers["user-agent"] as string | undefined,
  });
};
