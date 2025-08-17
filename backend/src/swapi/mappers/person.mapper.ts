import { Injectable } from "@nestjs/common";
import type {
  SwapiPersonDto,
  SwapiPerson,
  SwapiPersonSummary,
  SwapiMovie,
  SwapiMovieSummary,
} from "../swapi.dto";

@Injectable()
export class PersonMapper {
  toSummary(person: SwapiPersonDto): SwapiPersonSummary {
    return {
      uid: person.uid,
      name: person.properties.name,
    };
  }

  toSummaries(people: SwapiPersonDto[]): SwapiPersonSummary[] {
    return people.map((person) => this.toSummary(person));
  }

  toPerson(
    person: SwapiPersonDto,
    movies: (SwapiMovie | SwapiMovieSummary)[],
  ): SwapiPerson {
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
      },
    } = person;

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

  extractFilmIds(person: SwapiPersonDto): string[] {
    return person.properties.films.map((url) => this.extractIdFromUrl(url));
  }

  private extractIdFromUrl(url: string): string {
    return url.split("/").filter(Boolean).pop() || "";
  }
}
