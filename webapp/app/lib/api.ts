import axios, { type AxiosInstance } from "axios";

let _api: AxiosInstance | undefined;
export function api() {
  if (!_api) {
    _api = axios.create({
      baseURL: process.env.VITE_API_URL || "http://localhost:3000",
    });
  }
  return _api;
}

export type SearchType = "people" | "movies";
export type PersonSummary = {
  name: string;
  uid: string;
};
export function isPersonSummary(
  item: PersonSummary | MovieSummary,
): item is PersonSummary {
  return (item as PersonSummary).name !== undefined;
}
export type MovieSummary = {
  uid: string;
  title: string;
};
export type SearchResult = PersonSummary | MovieSummary;

export type Person = {
  uid: string;
  name: string;
  height: string;
  gender: string;
  birth_year: string;
  eye_color: string;
  hair_color: string;
  mass: string;
  movies: MovieSummary[];
};
export type Movie = {
  uid: string;
  title: string;
  opening_crawl: string;
  characters: PersonSummary[];
};
