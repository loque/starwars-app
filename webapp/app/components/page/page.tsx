import { ChevronLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="relative flex items-center justify-center bg-background min-h-[3.677rem] md:min-h-[3.125rem] border-b-brand border-b-1 md:border-b-0 md:shadow-[0_2px_0_0_#dadada]">
      {children}
    </header>
  );
}

export function HeaderTitle() {
  return <h1 className="text-brand font-bold text-lg md:text-md">SWStarter</h1>;
}

export function HeaderBackButton({ pathname = "/" }: { pathname?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden text-brand rounded-full absolute left-4 top-1/2 -translate-y-1/2"
      asChild
    >
      <Link to={{ pathname }}>
        <ChevronLeft className="size-8" />
      </Link>
    </Button>
  );
}

export function Main({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("w-full flex-1 flex flex-col", className)}>
      {children}
    </main>
  );
}
