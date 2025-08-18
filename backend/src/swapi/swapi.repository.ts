import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { CacheService } from "../cache/cache.service";
import type {
  SwapiFilmDto,
  SwapiPersonDto,
  SwapiSuccessDto,
} from "./swapi.dto";

@Injectable()
export class SwapiRepository {
  private readonly logger = new Logger(SwapiRepository.name);
  private readonly TTL = 60 * 60 * 24; // 1 day in seconds

  constructor(
    private readonly http: HttpService,
    private readonly cache: CacheService,
  ) {}

  async searchPeople(params: Record<string, any>): Promise<SwapiPersonDto[]> {
    const key = this.buildCacheKey("people", "search", params);
    return this.cache.wrap(key, this.TTL, async () => {
      const { data } = await firstValueFrom(
        this.http.get<SwapiSuccessDto<SwapiPersonDto[]>>("/people", { params }),
      );
      return data.result || [];
    });
  }

  async getPerson(id: string): Promise<SwapiPersonDto | null> {
    const key = this.buildCacheKey("people", "get", { id });
    return this.cache.wrap(key, this.TTL, async () => {
      const { data } = await firstValueFrom(
        this.http.get<SwapiSuccessDto<SwapiPersonDto>>(`/people/${id}`),
      );
      return data.result || null;
    });
  }

  async searchMovies(params: Record<string, any>): Promise<SwapiFilmDto[]> {
    const key = this.buildCacheKey("films", "search", params);
    return this.cache.wrap(key, this.TTL, async () => {
      const { data } = await firstValueFrom(
        this.http.get<SwapiSuccessDto<SwapiFilmDto[]>>("/films", { params }),
      );
      return data.result || [];
    });
  }

  async getMovie(id: string): Promise<SwapiFilmDto | null> {
    const key = this.buildCacheKey("films", "get", { id });
    return this.cache.wrap(key, this.TTL, async () => {
      const { data } = await firstValueFrom(
        this.http.get<SwapiSuccessDto<SwapiFilmDto>>(`/films/${id}`),
      );
      return data.result || null;
    });
  }

  private buildCacheKey(
    resource: string,
    operation: string,
    params?: Record<string, any>,
  ): string {
    const paramsString = params ? new URLSearchParams(params).toString() : "";
    return `swapi:${resource}:${operation}${paramsString ? `:${paramsString}` : ""}`;
  }
}
