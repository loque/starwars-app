import { Slot } from "@radix-ui/react-slot";
import { cn } from "~/lib/utils";

export function Card({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="card"
      className={cn(
        "w-full h-full p-8 pb-10 flex flex-col md:bg-background md:rounded-xs md:shadow-[0_1px_2px_0_#848484bf] md:border-[#dadada] md:border-1 md:w-auto md:h-auto",
        className,
      )}
      {...props}
    />
  );
}
