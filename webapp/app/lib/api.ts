import axios, { type AxiosInstance } from "axios";

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

let _api: AxiosInstance | undefined;
export function api() {
  if (!_api) {
    const baseURL = `http://${process.env.VITE_API_HOST || "localhost"}:${process.env.API_PORT}`;
    _api = axios.create({ baseURL });
  }
  return _api;
}

type SearchParams = {
  searchType: SearchType;
  searchTerm: string;
};

export async function search({ searchType, searchTerm }: SearchParams) {
  const searchProp = searchType === "people" ? "name" : "title";
  return api().get<SearchResult[]>(`/${searchType}`, {
    params: { [searchProp]: searchTerm },
  });
}

export async function getMovie(movieId?: string) {
  if (!movieId) return null;
  try {
    const res = await api().get<Movie>(`/movies/${movieId}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching movie by id ${movieId}`, error);
    return null;
  }
}

export async function getPerson(personId?: string) {
  if (!personId) return null;
  try {
    const res = await api().get<Person>(`/people/${personId}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching person by id ${personId}`, error);
    return null;
  }
}
