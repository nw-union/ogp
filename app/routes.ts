import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./routes/top.tsx"),
  route("api", "./routes/ogp.ts"),
] satisfies RouteConfig;
