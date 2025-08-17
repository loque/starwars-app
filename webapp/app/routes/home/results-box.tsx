import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { H2, H3, P } from "~/components/ui/text";
import { isPersonSummary, type SearchResult } from "~/lib/api";

type ResultsBoxProps = { results?: SearchResult[]; isLoading?: boolean };

export function ResultsBox({ results, isLoading }: ResultsBoxProps) {
  return (
    <Card className="flex-1 md:min-h-[43rem]">
      <H2 className="leading-5 pb-2">Results</H2>
      <div className="bg-[#c4c4c4] w-full h-0.25"></div>
      {!isLoading && !!results?.length && (
        <ul className="flex flex-col gap-2">
          {results.map((result) => (
            <li
              key={result.uid}
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#c4c4c4] py-2.5"
            >
              <H3>{isPersonSummary(result) ? result.name : result.title}</H3>
              <Button className="md:w-auto" asChild>
                <Link
                  to={
                    isPersonSummary(result)
                      ? `/person/${result.uid}`
                      : `/movie/${result.uid}`
                  }
                >
                  See Details
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
      {isLoading && (
        <div className="text-[#c4c4c4] font-bold text-center flex-1 flex flex-col justify-center">
          <P>Searching...</P>
        </div>
      )}
      {!isLoading && !results?.length && (
        <>
          <div className="text-[#c4c4c4] font-bold text-center flex-1 flex flex-col justify-center">
            <P>There are zero matches.</P>
            <P>Use the form to search for People or Movies.</P>
          </div>
          <Button className="md:hidden" asChild>
            <Link to={`/`}>Back to search</Link>
          </Button>
        </>
      )}
    </Card>
  );
}
