import { Card } from "~/components/ui/card";
import { H4 } from "~/components/ui/text";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

// TODO: input's placeholder depends on the selected radio option
export function SearchBox() {
  return (
    <Card className="justify-between md:gap-6 md:min-w-sm">
      <div className="flex flex-col gap-6">
        <H4>What are you searching for?</H4>
        <RadioGroup defaultValue="people" className="flex flex-row gap-8">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="people" id="people" />
            <Label htmlFor="people">People</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="movies" id="movies" />
            <Label htmlFor="movies">Movies</Label>
          </div>
        </RadioGroup>
        <Input placeholder="e.g. Chewbacca, Yoda" />
      </div>
      <div>
        <Button disabled>Search</Button>
      </div>
    </Card>
  );
}
