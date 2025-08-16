import type { Route } from "./+types/home.route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SWStarter" },
    { name: "description", content: "An app that returns results from the Start Wars API" },
  ];
}

export default function Home() {
  return <div>Home</div>;
}
