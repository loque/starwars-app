import type { Route } from "./+types/home.route";
import { useMatch } from "react-router";
import { ResultsBox } from "./results-box";
import { SearchBox } from "./search-box";
import { api, type SearchResult } from "~/lib/api";
import {
  Header,
  HeaderBackButton,
  HeaderTitle,
  Main,
} from "~/components/page/page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SWStarter" },
    {
      name: "description",
      content: "An app that returns results from the Start Wars API",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name") || undefined;

  return { name };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const searchType = formData.get("searchType");
  const searchTerm = formData.get("searchTerm");
  const searchProp = searchType === "people" ? "name" : "title";
  const res = await api().get<SearchResult[]>(`/${searchType}`, {
    params: { [searchProp]: searchTerm },
  });
  return res.data;
}

export default function Home({ actionData: results }: Route.ComponentProps) {
  const displayResults = Boolean(useMatch("/results"));

  return (
    <>
      <Header>
        {displayResults && <HeaderBackButton />}
        <HeaderTitle />
      </Header>
      <Main>
        <div data-slot="home" className="w-full h-full flex">
          <div className="md:hidden w-full h-full">
            {displayResults ? <ResultsBox results={results} /> : <SearchBox />}
          </div>
          <div className="hidden md:flex flex-1 flex-row max-w-5xl gap-8 py-8 mx-auto items-start">
            <SearchBox />
            <ResultsBox results={results} />
          </div>
        </div>
      </Main>
    </>
  );
}
