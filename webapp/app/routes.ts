import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx",[
    route("results?", "routes/home/home.route.tsx"),
    route("movie/:movieId?", "routes/movie/movie.route.tsx"),
    route("person/:personId?", "routes/person/person.route.tsx")
  ])
] satisfies RouteConfig;
