import { useMatch } from "react-router";
import type { Route } from "./+types/home.route";
import { ResultsBox } from "./results-box";
import { SearchBox } from "./search-box";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SWStarter" },
    {
      name: "description",
      content: "An app that returns results from the Start Wars API",
    },
  ];
}

export default function Home() {
  const displayResults = Boolean(useMatch("/results"));

  return (
    <div data-slot="home" className="w-full h-full">
      <div className="md:hidden w-full h-full">
        {displayResults ? <ResultsBox /> : <SearchBox />}
      </div>
      <div className="hidden md:block">
        <SearchBox />
        <ResultsBox />
      </div>
    </div>
  );
}
