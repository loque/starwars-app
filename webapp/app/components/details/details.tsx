import { Link } from "react-router";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { H3 } from "../ui/text";
import { cn } from "~/lib/utils";
import { Header, HeaderBackButton, HeaderTitle, Main } from "../page/page";

export function DetailsPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header>
        <HeaderBackButton />
        <HeaderTitle />
      </Header>
      <Main>
        <div className="md:py-8 max-w-4xl w-full mx-auto flex-1">
          <Card className="gap-8">{children}</Card>
        </div>
      </Main>
    </>
  );
}

export function DetailsBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-36 flex-1">
      {children}
    </div>
  );
}

export function DetailsSection({ children }: { children: React.ReactNode }) {
  return <div className="flex-1">{children}</div>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <H3>{children}</H3>
      <Divider />
    </>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className="pt-3 pb-2">
      <div className={cn("bg-[#c4c4c4] w-full h-0.25", className)}></div>
    </div>
  );
}

export function BackButton() {
  return (
    <div className="flex md:flex-start">
      <Button className="md:w-auto" asChild>
        <Link to={`/`}>Back to search</Link>
      </Button>
    </div>
  );
}
