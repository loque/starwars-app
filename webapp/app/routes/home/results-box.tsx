import { Card } from "~/components/ui/card";
import { H2, P } from "~/components/ui/text";

export function ResultsBox() {
  return (
    <Card className="flex-1 md:min-h-[43rem]">
      <H2 className="leading-5 pb-2">Results</H2>
      <div className="bg-[#c4c4c4] w-full h-0.25"></div>
      <div className="text-[#c4c4c4] font-bold text-center">
        <P>There are zero matches.</P>
        <P>Use the form to search for People or Movies.</P>
      </div>
    </Card>
  );
}
