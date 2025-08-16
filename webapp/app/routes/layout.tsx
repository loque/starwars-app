import { Outlet } from 'react-router';

export default function MainLayout() {
  return (
    <>
      <header>
        <h1 className='text-brand'>SWStarter</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
