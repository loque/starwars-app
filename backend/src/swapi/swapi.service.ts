import { HttpService } from "@nestjs/axios";
import { HttpException, Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { RedisService } from "src/redis/redis.service";
import type { AxiosError } from "axios";
import type {
  SwapiFilmDto,
  SwapiMovie,
  SwapiPerson,
  SwapiPersonDto,
  SwapiSuccessDto,
} from "./swapi-dtos";

@Injectable()
export class SwapiService {
  constructor(
    private readonly http: HttpService,
    private readonly cache: RedisService,
  ) {}

  private readonly TTL = 60 * 60 * 24; // 1 day in seconds

  private keyPeopleSearch(q: string) {
    return `swapi:people:search:q=${q}}`;
  }

  private keyPerson(id: string) {
    return `swapi:people:${id}`;
  }

  private keyMoviesSearch(q: string) {
    return `swapi:movies:search:q=${q}`;
  }

  private keyMovie(id: string) {
    return `swapi:movies:${id}`;
  }

  private extractIdFromUrl(url: string): string {
    if (typeof url !== "string") return "";
    return url.split("/").filter(Boolean).pop() || "";
  }

  private async expandPersonResult(
    person: SwapiPersonDto,
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
      films.map((url) => this.getMovie(this.extractIdFromUrl(url))),
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

  private async expandFilmResult(film: SwapiFilmDto): Promise<SwapiMovie> {
    const {
      uid,
      properties: { title, opening_crawl, characters },
    } = film;

    const characterDetails = await Promise.all(
      characters.map((url) => this.searchPeople(this.extractIdFromUrl(url))),
    );

    return {
      uid,
      title,
      opening_crawl,
      characters: characterDetails.flat(),
    };
  }

  async searchPeople(query: string): Promise<SwapiPerson[]> {
    const key = this.keyPeopleSearch(query || "");
    return this.cache.wrap(key, this.TTL, async () => {
      try {
        const { data } = await firstValueFrom(
          this.http.get<SwapiSuccessDto<SwapiPersonDto>>("/people", {
            params: { search: query },
          }),
        );
        const people = data.result.map((p) => this.expandPersonResult(p));
        return Promise.all(people);
      } catch (err) {
        const error = err as AxiosError;
        throw new HttpException(error.message, error.response?.status ?? 500);
      }
    });
  }

  async getPerson(id: string): Promise<SwapiPerson> {
    const key = this.keyPerson(id);
    return this.cache.wrap(key, this.TTL, async () => {
      try {
        const { data } = await firstValueFrom(
          this.http.get<SwapiSuccessDto<SwapiPersonDto>>(`/people/${id}`),
        );
        if (!data.result || data.result.length === 0) {
          throw new HttpException("Person not found", 404);
        }
        return this.expandPersonResult(data.result[0]);
      } catch (err) {
        const error = err as AxiosError;
        throw new HttpException(error.message, error.response?.status ?? 500);
      }
    });
  }

  async searchMovies(query: string): Promise<SwapiMovie[]> {
    const key = this.keyMoviesSearch(query || "");
    return this.cache.wrap(key, this.TTL, async () => {
      try {
        const { data } = await firstValueFrom(
          this.http.get<SwapiSuccessDto<SwapiFilmDto>>("/films", {
            params: { search: query },
          }),
        );
        if (!data.result || data.result.length === 0) {
          throw new HttpException("Movie not found", 404);
        }
        const movies = data.result.map((m) => this.expandFilmResult(m));
        return Promise.all(movies);
      } catch (err) {
        const error = err as AxiosError;
        throw new HttpException(error.message, error.response?.status ?? 500);
      }
    });
  }

  async getMovie(id: string): Promise<SwapiMovie> {
    const key = this.keyMovie(id);
    return this.cache.wrap(key, this.TTL, async () => {
      try {
        const { data } = await firstValueFrom(
          this.http.get<SwapiSuccessDto<SwapiFilmDto>>(`/films/${id}`),
        );
        if (!data.result || data.result.length === 0) {
          throw new HttpException("Film not found", 404);
        }
        return this.expandFilmResult(data.result[0]);
      } catch (err) {
        const error = err as AxiosError;
        throw new HttpException(error.message, error.response?.status ?? 500);
      }
    });
  }
}
