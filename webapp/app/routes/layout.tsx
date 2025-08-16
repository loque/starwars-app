import { Outlet } from 'react-router';

export default function MainLayout() {
  return (
    <>
      <header>
        <h1>SWStarter</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
