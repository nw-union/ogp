import { RouterContextProvider, createContext } from "react-router";

declare global {
  interface CloudflareEnvironment extends Env {
    OGP_CACHE: KVNamespace;
  }
}

type CloudflareContext = {
  env: CloudflareEnvironment;
  ctx: Omit<ExecutionContext, "props">;
};

export const cloudflareContext = createContext<CloudflareContext>();

export function getLoadContext({
  env,
  ctx,
}: {
  env: CloudflareEnvironment;
  ctx: Omit<ExecutionContext, "props">;
}): RouterContextProvider {
  const provider = new RouterContextProvider();
  provider.set(cloudflareContext, { env, ctx });
  return provider;
}
