import { cn } from '~/lib/utils';

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "w-full h-full p-8",
        className
      )}
      {...props}
    />
  )
}