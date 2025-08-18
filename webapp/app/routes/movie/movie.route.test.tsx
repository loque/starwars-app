import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Movie from "./movie.route";
import { getMovie } from "~/lib/api";
import type { Route } from "./+types/movie.route";
import { MemoryRouter } from "react-router";

vi.mock("~/lib/api");

const mockMatches: Route.ComponentProps["matches"] = [
  {
    id: "root",
    pathname: "/",
    handle: {
      title: "Star Wars",
    },
    data: undefined,
    params: {},
    loaderData: undefined,
  },
  {
    id: "routes/movie/movie.route",
    pathname: "/movie/1",
    handle: {},
    data: {
      title: "A New Hope",
      opening_crawl: "It is a period of civil war.",
      characters: [],
      uid: "1",
    },
    params: { movieId: "1" },
    loaderData: {
      title: "A New Hope",
      opening_crawl: "It is a period of civil war.",
      characters: [],
      uid: "1",
    },
  },
];

describe("Movie route", () => {
  it("should render movie details", async () => {
    const movie = {
      title: "A New Hope",
      opening_crawl: "It is a period of civil war.",
      characters: [],
      uid: "1",
    };
    (getMovie as ReturnType<typeof vi.fn>).mockResolvedValue(movie);

    render(
      <MemoryRouter>
        <Movie
          loaderData={movie}
          params={{ movieId: "1" }}
          matches={mockMatches}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(movie.title)).toBeInTheDocument();
    expect(screen.getByText(movie.opening_crawl)).toBeInTheDocument();
  });
});
