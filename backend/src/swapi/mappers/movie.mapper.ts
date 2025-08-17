import { Injectable } from "@nestjs/common";
import type {
  SwapiFilmDto,
  SwapiMovie,
  SwapiMovieSummary,
  SwapiPerson,
  SwapiPersonSummary,
} from "../swapi.dto";

@Injectable()
export class MovieMapper {
  toSummary(movie: SwapiFilmDto): SwapiMovieSummary {
    return {
      uid: movie.uid,
      title: movie.properties.title,
    };
  }

  toSummaries(movies: SwapiFilmDto[]): SwapiMovieSummary[] {
    return movies.map((movie) => this.toSummary(movie));
  }

  toMovie(
    film: SwapiFilmDto,
    characters: (SwapiPerson | SwapiPersonSummary)[],
  ): SwapiMovie {
    const {
      uid,
      properties: { title, opening_crawl },
    } = film;

    return {
      uid,
      title,
      opening_crawl,
      characters: characters.flat(),
    };
  }

  extractCharacterIds(film: SwapiFilmDto): string[] {
    return film.properties.characters.map((url) => this.extractIdFromUrl(url));
  }

  private extractIdFromUrl(url: string): string {
    return url.split("/").filter(Boolean).pop() || "";
  }
}
