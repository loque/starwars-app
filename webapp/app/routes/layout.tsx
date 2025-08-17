import { Outlet } from "react-router";

export default function MainLayout() {
  return (
    <>
      <header className="flex items-center justify-center bg-background min-h-[3.677rem] md:min-h-[3.125rem] border-b-brand border-b-1 md:border-b-0 md:shadow-[0_2px_0_0_#dadada]">
        <h1 className="text-brand font-bold text-lg md:text-md">SWStarter</h1>
      </header>
      <main className="w-full flex-1 flex flex-col">
        <Outlet />
      </main>
    </>
  );
}
