import { cn } from "~/lib/utils";

export function H2({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("font-bold text-lg md:text-md", className)} {...props} />
  );
}

export function H4({ className, ...props }: React.ComponentProps<"h4">) {
  return (
    <h4
      className={cn(
        "font-regular md:font-semibold text-sm md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function P({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("font-regular text-sm md:text-sm", className)}
      {...props}
    />
  );
}
