import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("results?", "routes/home/home.route.tsx"),
  route("movie/:movieId?", "routes/movie/movie.route.tsx"),
  route("person/:personId?", "routes/person/person.route.tsx"),
  route("*", "routes/not-found.route.tsx"),
] satisfies RouteConfig;
