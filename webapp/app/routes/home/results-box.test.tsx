import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ResultsBox } from "./results-box";
import { MemoryRouter } from "react-router";
import type { PersonSummary, MovieSummary } from "~/lib/api";

const mockPeople: PersonSummary[] = [
  { uid: "1", name: "Luke Skywalker" },
  { uid: "2", name: "Darth Vader" },
];

const mockMovies: MovieSummary[] = [
  { uid: "1", title: "A New Hope" },
  { uid: "2", title: "The Empire Strikes Back" },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: MemoryRouter });
};

describe("ResultsBox", () => {
  it("should display a loading message when isLoading is true", () => {
    renderWithRouter(<ResultsBox isLoading={true} />);
    expect(screen.getByText("Searching...")).toBeInTheDocument();
  });

  it('should display a "no matches" message when there are no results', () => {
    renderWithRouter(<ResultsBox results={[]} />);
    expect(screen.getByText("There are zero matches.")).toBeInTheDocument();
  });

  it("should render a list of people", () => {
    renderWithRouter(<ResultsBox results={mockPeople} />);
    expect(screen.getByText("Luke Skywalker")).toBeInTheDocument();
    expect(screen.getByText("Darth Vader")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/person/1");
    expect(links[1]).toHaveAttribute("href", "/person/2");
  });

  it("should render a list of movies", () => {
    renderWithRouter(<ResultsBox results={mockMovies} />);
    expect(screen.getByText("A New Hope")).toBeInTheDocument();
    expect(screen.getByText("The Empire Strikes Back")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/movie/1");
    expect(links[1]).toHaveAttribute("href", "/movie/2");
  });
});
