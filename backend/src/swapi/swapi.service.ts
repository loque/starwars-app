import { HttpException, Injectable, Logger } from "@nestjs/common";
import { SwapiRepository } from "./swapi.repository";
import { PersonMapper } from "./mappers/person.mapper";
import { MovieMapper } from "./mappers/movie.mapper";
import * as z from "zod";
import type {
  SwapiMovie,
  SwapiMovieSummary,
  SwapiPerson,
  SwapiPersonSummary,
} from "./swapi.dto";

const searchParamsSchema = z.object({ name: z.string().optional() }).strict();
const searchMoviesSchema = z.object({ title: z.string().optional() }).strict();

type SearchPeopleParamsInput = z.input<typeof searchParamsSchema>;
type SearchMoviesParamsInput = z.input<typeof searchMoviesSchema>;

@Injectable()
export class SwapiService {
  private readonly logger = new Logger(SwapiService.name);

  constructor(
    private readonly repository: SwapiRepository,
    private readonly personMapper: PersonMapper,
    private readonly movieMapper: MovieMapper,
  ) {}

  async searchPeople(
    input: SearchPeopleParamsInput,
  ): Promise<SwapiPersonSummary[]> {
    try {
      const params = searchParamsSchema.parse(input);
      const peopleDto = await this.repository.searchPeople(params);
      return this.personMapper.toSummaries(peopleDto);
    } catch (error) {
      this.handleError("Error searching people", error);
    }
  }

  async getPerson(id: string): Promise<SwapiPerson> {
    try {
      const personDto = await this.repository.getPerson(id);
      if (!personDto) {
        throw new HttpException("Person not found", 404);
      }

      const filmIds = this.personMapper.extractFilmIds(personDto);
      const movies = await this.getMovieSummariesByIds(filmIds);

      return this.personMapper.toPerson(personDto, movies);
    } catch (error) {
      this.handleError("Error fetching person", error);
    }
  }

  async searchMovies(
    input: SearchMoviesParamsInput,
  ): Promise<SwapiMovieSummary[]> {
    try {
      const params = searchMoviesSchema.parse(input);
      const moviesDto = await this.repository.searchMovies(params);
      return this.movieMapper.toSummaries(moviesDto);
    } catch (error) {
      this.handleError("Error searching movies", error);
    }
  }

  async getMovie(id: string): Promise<SwapiMovie> {
    try {
      const movieDto = await this.repository.getMovie(id);
      if (!movieDto) {
        throw new HttpException("Film not found", 404);
      }

      const characterIds = this.movieMapper.extractCharacterIds(movieDto);
      const characters = await this.getPersonSummariesByIds(characterIds);

      return this.movieMapper.toMovie(movieDto, characters);
    } catch (error) {
      this.handleError("Error fetching movie", error);
    }
  }

  private async getMovieSummariesByIds(
    ids: string[],
  ): Promise<SwapiMovieSummary[]> {
    const movies = await Promise.all(
      ids.map(async (id) => {
        const movieDto = await this.repository.getMovie(id);
        return movieDto ? this.movieMapper.toSummary(movieDto) : null;
      }),
    );
    return movies.filter(Boolean) as SwapiMovieSummary[];
  }

  private async getPersonSummariesByIds(
    ids: string[],
  ): Promise<SwapiPersonSummary[]> {
    const people = await Promise.all(
      ids.map(async (id) => {
        const personDto = await this.repository.getPerson(id);
        return personDto ? this.personMapper.toSummary(personDto) : null;
      }),
    );
    return people.filter(Boolean) as SwapiPersonSummary[];
  }

  private handleError(message: string, error: any): never {
    this.logger.error(
      `${message}: ${error instanceof Error ? error.message : ""}`,
      error,
    );
    if (error instanceof HttpException) throw error;
    throw new HttpException("Internal server error", 500);
  }
}
