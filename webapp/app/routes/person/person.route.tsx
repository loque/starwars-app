import type { Route } from "./+types/person.route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Person Details - SWStarter" },
    { name: "description", content: "An app that returns results from the Start Wars API" },
  ];
}

export default function PersonDetails() {
  return <div>PersonDetails</div>;
}
