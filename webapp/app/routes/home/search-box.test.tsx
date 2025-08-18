import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchBox } from "./search-box";
import { MemoryRouter } from "react-router";
import type { FetcherWithComponents } from "react-router";

const mockFetcher = {
  submit: vi.fn(),
  Form: vi.fn(),
  load: vi.fn(),
  data: undefined,
  state: "idle",
  key: "test",
  type: "init",
  formData: undefined,
  json: undefined,
  text: undefined,
  formAction: undefined,
  formMethod: undefined,
  formEncType: undefined,
  submission: undefined,
};

const renderWithRouter = (ui: React.ReactElement, { route = "/" } = {}) => {
  window.history.pushState({}, "Test page", route);

  return render(ui, { wrapper: MemoryRouter });
};

describe("SearchBox", () => {
  it("should update input value on change", () => {
    renderWithRouter(
      <SearchBox
        isLoading={false}
        fetcher={mockFetcher as unknown as FetcherWithComponents<any>}
      />,
    );
    const input = screen.getByPlaceholderText(/chewbacca/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Luke" } });
    expect(input.value).toBe("Luke");
  });

  it("should update search type on radio button change", () => {
    renderWithRouter(
      <SearchBox
        isLoading={false}
        fetcher={mockFetcher as unknown as FetcherWithComponents<any>}
      />,
    );
    const movieRadio = screen.getByLabelText("Movies");
    fireEvent.click(movieRadio);
    expect(movieRadio).toHaveAttribute("aria-checked", "true");
  });

  it("should disable search button when input is empty", () => {
    renderWithRouter(
      <SearchBox
        isLoading={false}
        fetcher={mockFetcher as unknown as FetcherWithComponents<any>}
      />,
    );
    const searchButton = screen.getByRole("button", { name: "Search" });
    expect(searchButton).toBeDisabled();
  });

  it("should enable search button when input is not empty", () => {
    renderWithRouter(
      <SearchBox
        isLoading={false}
        fetcher={mockFetcher as unknown as FetcherWithComponents<any>}
      />,
    );
    const input = screen.getByPlaceholderText(/chewbacca/i);
    fireEvent.change(input, { target: { value: "Luke" } });
    const searchButton = screen.getByRole("button", { name: "Search" });
    expect(searchButton).not.toBeDisabled();
  });

  it("should call fetcher.submit with the correct form data", () => {
    const fetcher = { ...mockFetcher, submit: vi.fn() };
    renderWithRouter(
      <SearchBox
        isLoading={false}
        fetcher={fetcher as unknown as FetcherWithComponents<any>}
      />,
    );
    const input = screen.getByPlaceholderText(/chewbacca/i);
    const peopleRadio = screen.getByLabelText("People") as HTMLInputElement;
    const searchButton = screen.getByRole("button", { name: "Search" });

    fireEvent.change(input, { target: { value: "Anakin" } });
    fireEvent.click(peopleRadio);
    fireEvent.click(searchButton);

    expect(fetcher.submit).toHaveBeenCalled();
  });
});
