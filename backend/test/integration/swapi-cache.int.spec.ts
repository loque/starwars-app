import { HttpService } from "@nestjs/axios";
import { Test, TestingModule } from "@nestjs/testing";
import { of } from "rxjs";
import { CacheService } from "../../src/cache/cache.service";
import { SwapiRepository } from "../../src/swapi/swapi.repository";
import { SwapiPersonDto } from "../../src/swapi/swapi.dto";
import { AxiosResponse } from "axios";
import { getRedisConnectionToken } from "@nestjs-modules/ioredis";

const mockPersonDto: SwapiPersonDto = {
  properties: {
    name: "Luke Skywalker",
    height: "172",
    mass: "77",
    hair_color: "blond",
    eye_color: "blue",
    birth_year: "19BBY",
    gender: "male",
    films: ["https://www.swapi.tech/api/films/1/"],
  },
  uid: "1",
};

const mockSwapiSuccessResponse = {
  message: "ok",
  result: mockPersonDto,
};

describe("Swapi-Cache", () => {
  let repository: SwapiRepository;
  let httpService: HttpService;
  let redisClient: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(async () => {
    redisClient = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapiRepository,
        CacheService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getRedisConnectionToken(),
          useValue: redisClient,
        },
      ],
    }).compile();

    repository = module.get<SwapiRepository>(SwapiRepository);
    httpService = module.get<HttpService>(HttpService);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("getPerson", () => {
    it("should fetch from SWAPI and set cache on a cache miss", async () => {
      const personId = "1";
      const cacheKey = "swapi:people:get:id=1";

      // Simulate a cache miss
      redisClient.get.mockResolvedValue(null);

      // Simulate call to SWAPI
      const httpSpy = jest.spyOn(httpService, "get").mockReturnValue(
        of({
          data: mockSwapiSuccessResponse,
          status: 200,
          statusText: "OK",
          headers: {},
        } as AxiosResponse<any>),
      );

      const result = await repository.getPerson(personId);

      expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
      expect(httpSpy).toHaveBeenCalledWith(`/people/${personId}`);
      expect(redisClient.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockPersonDto),
        "EX",
        expect.any(Number),
      );
      expect(result).toEqual(mockPersonDto);
    });

    it("should return cached data on a cache hit", async () => {
      const personId = "1";
      const cacheKey = "swapi:people:get:id=1";

      // Simulate a cache hit
      redisClient.get.mockResolvedValue(JSON.stringify(mockPersonDto));

      // Spy call to SWAPI
      const httpSpy = jest.spyOn(httpService, "get");

      const result = await repository.getPerson(personId);

      expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
      expect(httpSpy).not.toHaveBeenCalled(); // Crucial check for cache hit
      expect(redisClient.set).not.toHaveBeenCalled();
      expect(result).toEqual(mockPersonDto);
    });
  });

  describe("searchPeople", () => {
    it("should use unique cache keys for different search queries", async () => {
      const paramsLuke = { name: "luke" };
      const cacheKeyLuke = "swapi:people:search:name=luke";
      const mockSwapiResponseLuke = {
        message: "ok",
        result: [mockPersonDto],
      };

      const paramsLeia = { name: "leia" };
      const cacheKeyLeia = "swapi:people:search:name=leia";
      const mockLeiaDto = {
        ...mockPersonDto,
        uid: "5",
        properties: { ...mockPersonDto.properties, name: "Leia Organa" },
      };
      const mockSwapiResponseLeia = {
        message: "ok",
        result: [mockLeiaDto],
      };

      // Simulate cache misses for both keys
      redisClient.get.mockResolvedValue(null);

      // Mock HttpService to return different results based on params
      const httpSpy = jest
        .spyOn(httpService, "get")
        .mockImplementation(
          (url: string, config?: { params?: { name?: string } }) => {
            if (config?.params?.name === "luke") {
              return of({
                data: mockSwapiResponseLuke,
                status: 200,
                statusText: "OK",
                headers: {},
              } as AxiosResponse<any>);
            }
            if (config?.params?.name === "leia") {
              return of({
                data: mockSwapiResponseLeia,
                status: 200,
                statusText: "OK",
                headers: {},
              } as AxiosResponse<any>);
            }
            return of({} as AxiosResponse<any>);
          },
        );

      // First call
      const result1 = await repository.searchPeople(paramsLuke);

      // Verify first call
      expect(redisClient.get).toHaveBeenCalledWith(cacheKeyLuke);
      expect(httpSpy).toHaveBeenCalledWith("/people", { params: paramsLuke });
      expect(redisClient.set).toHaveBeenCalledWith(
        cacheKeyLuke,
        JSON.stringify(mockSwapiResponseLuke.result),
        "EX",
        expect.any(Number),
      );
      expect(result1).toEqual(mockSwapiResponseLuke.result);

      // Second call
      const result2 = await repository.searchPeople(paramsLeia);

      // Verify second call
      expect(redisClient.get).toHaveBeenCalledWith(cacheKeyLeia);
      expect(httpSpy).toHaveBeenCalledWith("/people", { params: paramsLeia });
      expect(redisClient.set).toHaveBeenCalledWith(
        cacheKeyLeia,
        JSON.stringify(mockSwapiResponseLeia.result),
        "EX",
        expect.any(Number),
      );
      expect(result2).toEqual(mockSwapiResponseLeia.result);

      // Ensure set was called twice with different keys
      expect(redisClient.set).toHaveBeenCalledTimes(2);
    });
  });
});
