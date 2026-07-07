import { QueryCache, MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";
import { friendlyMessage, toFriendlyError } from "./lib/errors";
import { DefaultRouteError, DefaultRouteNotFound } from "./components/layout/RouteBoundary";

function reportToUser(err: unknown, action: "load" | "save") {
  const friendly = toFriendlyError(err);
  // Auth expiry: one toast is enough; the auth listener will redirect.
  const title = action === "save" ? "Couldn't save changes" : "Couldn't load that";
  toast.error(title, { description: friendly.message });
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, err) => {
          const kind = toFriendlyError(err).kind;
          // Don't retry things the user has to fix — auth/permission/validation/notFound.
          if (["auth", "permission", "validation", "notFound"].includes(kind)) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
    queryCache: new QueryCache({
      onError: (err, query) => {
        // Suppress toast when the caller opts out (meta.silent) or handles it locally (meta.handled).
        const meta = query.meta as { silent?: boolean; handled?: boolean } | undefined;
        if (meta?.silent || meta?.handled) return;
        reportToUser(err, "load");
      },
    }),
    mutationCache: new MutationCache({
      onError: (err, _vars, _ctx, mutation) => {
        const meta = mutation.meta as { silent?: boolean; handled?: boolean } | undefined;
        if (meta?.silent || meta?.handled) return;
        // Skip toast if the mutation defines its own onError — let it own the UX.
        if (mutation.options.onError) return;
        reportToUser(err, "save");
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultRouteError,
    defaultNotFoundComponent: DefaultRouteNotFound,
    defaultOnCatch: (err) => {
      // Last-resort logger so an unhandled render error still surfaces friendlily.
      console.error("[route boundary]", friendlyMessage(err));
    },
  });

  return router;
};
