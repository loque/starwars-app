import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { H2, H3, P } from "~/components/ui/text";
import { isPersonSummary, type SearchResult } from "~/lib/api";

type ResultsBoxProps = { results?: SearchResult[] };

export function ResultsBox({ results }: ResultsBoxProps) {
  return (
    <Card className="flex-1 md:min-h-[43rem]">
      <H2 className="leading-5 pb-2">Results</H2>
      <div className="bg-[#c4c4c4] w-full h-0.25"></div>
      {results?.length && !!results.length && (
        <ul className="flex flex-col gap-2">
          {results.map((result) => (
            <li
              key={result.uid}
              className="flex justify-between items-center border-b border-[#c4c4c4] py-2.5"
            >
              <H3>{isPersonSummary(result) ? result.name : result.title}</H3>
              <Button className="w-auto" asChild>
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
      {!results?.length && (
        <div className="text-[#c4c4c4] font-bold text-center">
          <P>There are zero matches.</P>
          <P>Use the form to search for People or Movies.</P>
        </div>
      )}
    </Card>
  );
}
