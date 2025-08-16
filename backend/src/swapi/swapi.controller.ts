import { Controller, Get, Param, Query, UseInterceptors } from "@nestjs/common";
import { SwapiService } from "./swapi.service";
import { MetricsInterceptor } from "../metrics/metrics.interceptor";

@Controller("")
@UseInterceptors(MetricsInterceptor)
export class SwapiController {
  constructor(private readonly swapiService: SwapiService) {}

  @Get("health")
  healthCheck() {
    return "ok";
  }

  @Get("people")
  searchPeople(@Query("name") name: string) {
    return this.swapiService.searchPeople({ name });
  }

  @Get("people/:id")
  getPersonById(@Param("id") id: string) {
    return this.swapiService.getPerson(id);
  }

  @Get("movies")
  searchMovies(@Query("title") title: string) {
    return this.swapiService.searchMovies({ title });
  }

  @Get("movies/:id")
  getMovieById(@Param("id") id: string) {
    return this.swapiService.getMovie(id);
  }
}
