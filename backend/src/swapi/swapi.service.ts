import { HttpService } from "@nestjs/axios";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { CacheService } from "src/cache/cache.service";
import type { AxiosError } from "axios";
import type {
  SwapiFilmDto,
  SwapiMovie,
  SwapiMovieSummary,
  SwapiPerson,
  SwapiPersonDto,
  SwapiPersonSummary,
  SwapiSuccessDto,
} from "./swapi-dtos";
import * as z from "zod";

const searchParamsSchema = z.object({ name: z.string().optional() }).strict();
type SearchPeopleParamsInput = z.input<typeof searchParamsSchema>;
type SearchPeopleParamsOutput = z.output<typeof searchParamsSchema>;

const searchMoviesSchema = z.object({ title: z.string().optional() }).strict();
type SearchMoviesParamsInput = z.input<typeof searchMoviesSchema>;
type SearchMoviesParamsOutput = z.output<typeof searchMoviesSchema>;

@Injectable()
export class SwapiService {
  private readonly logger = new Logger(SwapiService.name);

  constructor(
    private readonly http: HttpService,
    private readonly cache: CacheService,
  ) {}

  private readonly TTL = 60 * 60 * 24; // 1 day in seconds

  private keyPeopleSearch(params: SearchPeopleParamsOutput) {
    const paramsString = new URLSearchParams(params).toString();
    return `swapi:people:search:params=${paramsString}`;
  }

  private keyPerson(id: string, returnSummary: boolean = false) {
    return `swapi:people:${id}:${returnSummary ? "summary" : "full"}`;
  }

  private keyMoviesSearch(params: SearchMoviesParamsOutput) {
    const paramsString = new URLSearchParams(params).toString();
    return `swapi:movies:search:params=${paramsString}`;
  }

  private keyMovie(id: string, returnSummary: boolean = false) {
    return `swapi:movies:${id}:${returnSummary ? "summary" : "full"}`;
  }

  private extractIdFromUrl(url: string): string {
    if (typeof url !== "string") return "";
    return url.split("/").filter(Boolean).pop() || "";
  }

  private toPersonSummary(person: SwapiPersonDto): SwapiPersonSummary {
    return {
      uid: person.uid,
      name: person.properties.name,
    };
  }

  private async toPerson(
    person: SwapiPersonDto,
    moviesSummaries: boolean = true,
  ): Promise<SwapiPerson> {
    const {
      uid,
      properties: {
        name,
        height,
        gender,
        birth_year,
        eye_color,
        hair_color,
        mass,
        films,
      },
    } = person;

    const movies = await Promise.all(
      films.map((url) =>
        this.getMovie(this.extractIdFromUrl(url), moviesSummaries),
      ),
    );

    return {
      uid,
      name,
      height,
      gender,
      birth_year,
      eye_color,
      hair_color,
      mass,
      movies,
    };
  }

  private toMovieSummary(movie: SwapiFilmDto): SwapiMovieSummary {
    return {
      uid: movie.uid,
      title: movie.properties.title,
    };
  }

  private async toMovie(
    film: SwapiFilmDto,
    peopleSummaries: boolean = true,
  ): Promise<SwapiMovie> {
    const {
      uid,
      properties: { title, opening_crawl, characters },
    } = film;

    const characterDetails = await Promise.all(
      characters.map((url) =>
        this.getPerson(this.extractIdFromUrl(url), peopleSummaries),
      ),
    );

    return {
      uid,
      title,
      opening_crawl,
      characters: characterDetails.flat(),
    };
  }

  async searchPeople(
    input: SearchPeopleParamsInput,
  ): Promise<SwapiPersonSummary[]> {
    const params = searchParamsSchema.parse(input);
    const key = this.keyPeopleSearch(params);
    this.logger.debug(
      `Searching people key: ${key}, params: ${JSON.stringify(params)}`,
    );
    return this.cache.wrap(key, this.TTL, async () => {
      try {
        const { data } = await firstValueFrom(
          this.http.get<SwapiSuccessDto<SwapiPersonDto[]>>("/people", {
            params,
          }),
        );
        if (!data.result || data.result.length === 0) {
          return [];
        }
        const people = data.result.map((p) => this.toPersonSummary(p));
        return people;
      } catch (err) {
        const error = err as AxiosError;
        this.logger.error(`Error fetching people: ${error.message}`, error);
        throw new HttpException(error.message, error.response?.status ?? 500);
      }
    });
  }

  async getPerson(
    id: string,
    returnSummary: boolean = false,
  ): Promise<SwapiPerson | SwapiPersonSummary> {
    const key = this.keyPerson(id, returnSummary);
    this.logger.debug(`Getting person key: ${key}`);
    return this.cache.wrap(key, this.TTL, async () => {
      try {
        const { data } = await firstValueFrom(
          this.http.get<SwapiSuccessDto<SwapiPersonDto>>(`/people/${id}`),
        );
        if (!data.result) {
          throw new HttpException("Person not found", 404);
        }
        if (returnSummary) {
          return this.toPersonSummary(data.result);
        }
        return this.toPerson(data.result, true);
      } catch (err) {
        const error = err as AxiosError;
        this.logger.error(`Error fetching person: ${error.message}`, error);
        throw new HttpException(error.message, error.response?.status ?? 500);
      }
    });
  }

  async searchMovies(
    input: SearchMoviesParamsInput,
  ): Promise<SwapiMovieSummary[]> {
    const params = searchMoviesSchema.parse(input);
    const key = this.keyMoviesSearch(params);
    this.logger.debug(
      `Searching movies key: ${key}, params: ${JSON.stringify(params)}`,
    );
    return this.cache.wrap(key, this.TTL, async () => {
      try {
        const { data } = await firstValueFrom(
          this.http.get<SwapiSuccessDto<SwapiFilmDto[]>>("/films", {
            params,
          }),
        );
        if (!data.result || data.result.length === 0) {
          return [];
        }
        const movies = data.result.map((m) => this.toMovieSummary(m));
        return movies;
      } catch (err) {
        const error = err as AxiosError;
        this.logger.error(`Error fetching movies: ${error.message}`, error);
        throw new HttpException(error.message, error.response?.status ?? 500);
      }
    });
  }

  async getMovie(
    id: string,
    returnSummary: boolean = false,
  ): Promise<SwapiMovie | SwapiMovieSummary> {
    const key = this.keyMovie(id, returnSummary);
    this.logger.debug(`Getting movie key: ${key}`);
    return this.cache.wrap(key, this.TTL, async () => {
      try {
        const { data } = await firstValueFrom(
          this.http.get<SwapiSuccessDto<SwapiFilmDto>>(`/films/${id}`),
        );
        if (!data.result) {
          throw new HttpException("Film not found", 404);
        }
        if (returnSummary) {
          return this.toMovieSummary(data.result);
        }
        return this.toMovie(data.result, true);
      } catch (err) {
        const error = err as AxiosError;
        this.logger.error(`Error fetching movie: ${error.message}`, error);
        throw new HttpException(error.message, error.response?.status ?? 500);
      }
    });
  }
}
