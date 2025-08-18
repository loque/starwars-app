import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Person from "./person.route";
import { getPerson } from "~/lib/api";
import { MemoryRouter } from "react-router";

vi.mock("~/lib/api");

const mockMatches: any = [
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
    id: "routes/person/person.route",
    pathname: "/person/1",
    handle: {},
    data: {
      name: "Luke Skywalker",
      height: "172",
      mass: "77",
      hair_color: "blond",
      eye_color: "blue",
      birth_year: "19BBY",
      gender: "male",
      movies: [],
      uid: "1",
    },
    params: { personId: "1" },
    loaderData: {
      name: "Luke Skywalker",
      height: "172",
      mass: "77",
      hair_color: "blond",
      eye_color: "blue",
      birth_year: "19BBY",
      gender: "male",
      movies: [],
      uid: "1",
    },
  },
];

describe("Person route", () => {
  it("should render person details", async () => {
    const person = {
      name: "Luke Skywalker",
      height: "172",
      mass: "77",
      hair_color: "blond",
      eye_color: "blue",
      birth_year: "19BBY",
      gender: "male",
      movies: [],
      uid: "1",
    };
    (getPerson as ReturnType<typeof vi.fn>).mockResolvedValue(person);

    render(
      <MemoryRouter>
        <Person
          loaderData={person}
          params={{ personId: "1" }}
          matches={mockMatches}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(person.name)).toBeInTheDocument();
    expect(screen.getByText(/Birth Year: 19BBY/)).toBeInTheDocument();
    expect(screen.getByText(/Gender: male/)).toBeInTheDocument();
    expect(screen.getByText(/Eye Color: blue/)).toBeInTheDocument();
    expect(screen.getByText(/Hair Color: blond/)).toBeInTheDocument();
    expect(screen.getByText(/Height: 172/)).toBeInTheDocument();
    expect(screen.getByText(/Mass: 77/)).toBeInTheDocument();
  });
});
