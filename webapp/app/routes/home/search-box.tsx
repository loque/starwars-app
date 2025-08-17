import { SimpleCard } from "~/components/ui/simple-card";
import { H4 } from "~/components/ui/text";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { SearchType } from "~/lib/api";
import { useNavigate, type FetcherWithComponents } from "react-router";
import { useState } from "react";

export function SearchBox({
  isLoading,
  fetcher,
}: {
  isLoading: boolean;
  fetcher: FetcherWithComponents<any>;
}) {
  const [searchType, setSearchType] = useState<SearchType>("people");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const navigate = useNavigate();

  function submitHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    navigate("/results");

    fetcher.submit(formData, {
      method: "post",
      action: "/results",
    });
  }

  const peoplePlaceholder = "e.g. Chewbacca, Yoda";
  const moviesPlaceholder = "e.g. A New Hope, The Empire Strikes Back";

  return (
    <SimpleCard className="justify-between md:gap-6 md:min-w-sm" asChild>
      <form onSubmit={submitHandler}>
        <div className="flex flex-col gap-6">
          <H4>What are you searching for?</H4>
          <RadioGroup
            name="searchType"
            value={searchType}
            onValueChange={(value) => setSearchType(value as SearchType)}
            className="flex flex-row gap-8"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="people" id="people" />
              <Label htmlFor="people">People</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="movies" id="movies" />
              <Label htmlFor="movies">Movies</Label>
            </div>
          </RadioGroup>
          <Input
            name="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              searchType === "people" ? peoplePlaceholder : moviesPlaceholder
            }
          />
        </div>
        <div>
          <Button type="submit" disabled={!searchTerm || isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>
    </SimpleCard>
  );
}
