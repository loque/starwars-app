import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api, search, getMovie, getPerson } from "./api";

describe("~/lib/api", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api());
  });

  afterEach(() => {
    mock.restore();
  });

  describe("search", () => {
    it("should search for people", async () => {
      const data = [{ name: "Luke Skywalker", uid: "1" }];
      mock.onGet("/people", { params: { name: "Luke" } }).reply(200, data);

      const result = await search({ searchType: "people", searchTerm: "Luke" });
      expect(result.data).toEqual(data);
    });

    it("should search for movies", async () => {
      const data = [{ title: "A New Hope", uid: "1" }];
      mock.onGet("/movies", { params: { title: "Hope" } }).reply(200, data);

      const result = await search({ searchType: "movies", searchTerm: "Hope" });
      expect(result.data).toEqual(data);
    });
  });

  describe("getMovie", () => {
    it("should get a movie by id", async () => {
      const data = { title: "A New Hope", uid: "1" };
      mock.onGet("/movies/1").reply(200, data);

      const result = await getMovie("1");
      expect(result).toEqual(data);
    });

    it("should return null if movie not found", async () => {
      mock.onGet("/movies/1").reply(404);

      const result = await getMovie("1");
      expect(result).toBeNull();
    });
  });

  describe("getPerson", () => {
    it("should get a person by id", async () => {
      const data = { name: "Luke Skywalker", uid: "1" };
      mock.onGet("/people/1").reply(200, data);

      const result = await getPerson("1");
      expect(result).toEqual(data);
    });

    it("should return null if person not found", async () => {
      mock.onGet("/people/1").reply(404);

      const result = await getPerson("1");
      expect(result).toBeNull();
    });
  });
});
