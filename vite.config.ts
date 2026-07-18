import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isServing = command === "serve";
  const allowAllHosts = env.ALLOW_ALL_HOSTS === "true";
  const configuredHosts = (env.ALLOWED_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
  const allowedHosts: true | string[] = allowAllHosts
    ? true
    : configuredHosts;

  if (isServing && mode === "production" && allowAllHosts) {
    throw new Error("ALLOW_ALL_HOSTS no puede estar habilitado en produccion.");
  }

  if (
    isServing &&
    mode === "production" &&
    !allowAllHosts &&
    configuredHosts.length === 0
  ) {
    throw new Error(
      "ALLOWED_HOSTS debe contener al menos un host en produccion.",
    );
  }

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      allowedHosts,
    },
    preview: {
      host: "0.0.0.0",
      allowedHosts,
    },
  };
});
