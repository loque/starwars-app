import type { Route } from "./+types/home.route";
import { useMatch, useFetcher } from "react-router";
import { ResultsBox } from "./results-box";
import { SearchBox } from "./search-box";
import { search, type SearchType } from "~/lib/api";
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

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const searchType = formData.get("searchType") as SearchType;
  const searchTerm = formData.get("searchTerm") as string;
  return search({ searchTerm, searchType });
}

export default function Home({ actionData }: Route.ComponentProps) {
  const displayResults = Boolean(useMatch("/results"));
  const fetcher = useFetcher();

  const searchResults = fetcher.data?.data || actionData?.data;
  const isLoading =
    fetcher.state !== "idle" || Boolean(actionData && !searchResults);

  const searchBox = <SearchBox fetcher={fetcher} isLoading={isLoading} />;
  const resultsBox = (
    <ResultsBox results={searchResults} isLoading={isLoading} />
  );

  return (
    <>
      <Header>
        {displayResults && !isLoading && <HeaderBackButton />}
        <HeaderTitle />
      </Header>
      <Main>
        <div data-slot="home" className="w-full h-full flex">
          <div className="md:hidden w-full h-full">
            {displayResults ? resultsBox : searchBox}
          </div>
          <div className="hidden md:flex flex-1 flex-row max-w-5xl gap-8 py-8 mx-auto items-start">
            {searchBox}
            {resultsBox}
          </div>
        </div>
      </Main>
    </>
  );
}
