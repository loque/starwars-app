import type { Route } from "./+types/movie.route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Movie Details - SWStarter" },
    { name: "description", content: "An app that returns results from the Start Wars API" },
  ];
}

export default function MovieDetails() {
  return <div>MovieDetails</div>;
}
