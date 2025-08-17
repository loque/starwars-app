import { Link } from "react-router";
import {
  Header,
  HeaderBackButton,
  HeaderTitle,
  Main,
} from "~/components/page/page";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { H2, P } from "~/components/ui/text";

export default function NotFound() {
  return (
    <>
      <Header>
        <HeaderBackButton />
        <HeaderTitle />
      </Header>
      <Main className="items-center pt-8">
        <Card className="md:max-w-md">
          <div className="flex-1 md:min-h-30">
            <H2>Not found</H2>
            <P>We couldn't find what you are looking for.</P>
          </div>
          <Button className="md:w-auto" asChild>
            <Link to={`/`}>Back to search</Link>
          </Button>
        </Card>
      </Main>
    </>
  );
}
