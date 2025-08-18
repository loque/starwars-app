import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Home from "./home.route";
import { createMemoryRouter, RouterProvider } from "react-router";

vi.mock("~/lib/api", async () => {
  const actual = await vi.importActual<typeof import("~/lib/api")>("~/lib/api");
  return {
    ...actual,
    search: vi.fn(),
  };
});

const renderWithRouter = (ui: React.ReactElement, { route = "/" } = {}) => {
  const routes = [
    {
      path: "/",
      element: ui,
      action: async ({ request }: { request: Request }) => {
        const formData = await request.formData();
        const searchType = formData.get("searchType") as any;
        const searchTerm = formData.get("searchTerm") as string;
        const { search } = await import("~/lib/api");
        return search({ searchTerm, searchType });
      },
    },
    {
      path: "/results",
      element: <div>Results</div>,
      action: async ({ request }: { request: Request }) => {
        const formData = await request.formData();
        const searchType = formData.get("searchType") as any;
        const searchTerm = formData.get("searchTerm") as string;
        const { search } = await import("~/lib/api");
        return search({ searchTerm, searchType });
      },
    },
  ];
  const router = createMemoryRouter(routes);
  return render(<RouterProvider router={router} />);
};

const mockMatches: any = [
  {
    id: "root",
    params: {},
    pathname: "/",
    data: undefined,
    loaderData: undefined,
    handle: undefined,
  },
  {
    id: "routes/home/home.route",
    params: {},
    pathname: "/",
    data: undefined,
    loaderData: undefined,
    handle: undefined,
  },
];

describe("HomeRoute", () => {
  it("should render the search box and results box", () => {
    renderWithRouter(
      <Home
        actionData={undefined}
        loaderData={undefined}
        params={{}}
        matches={mockMatches}
      />,
    );
    expect(
      screen.getAllByText("What are you searching for?")[0],
    ).toBeInTheDocument();
    expect(screen.getByText("Results")).toBeInTheDocument();
  });

  it("should call the search function when the form is submitted", async () => {
    const user = userEvent.setup();
    const { search } = await import("~/lib/api");
    (search as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    renderWithRouter(
      <Home
        actionData={undefined}
        loaderData={undefined}
        params={{}}
        matches={mockMatches}
      />,
    );

    const input = screen.getAllByPlaceholderText(/chewbacca/i)[0];
    await user.type(input, "Luke");

    const searchButton = screen.getAllByRole("button", { name: "Search" })[0];
    await user.click(searchButton);

    await vi.waitFor(() => {
      expect(search).toHaveBeenCalled();
    });
  });
});
