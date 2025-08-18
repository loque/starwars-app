import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { HttpService } from "@nestjs/axios";
import { of } from "rxjs";
import { getQueueToken } from "@nestjs/bull";
import { getRedisConnectionToken } from "@nestjs-modules/ioredis";
import { METRICS_QUEUE } from "../../src/metrics/metrics.constants";
import { getModelToken } from "@nestjs/mongoose";
import {
  MetricReport,
  MetricReportDocument,
  RequestMetric,
} from "../../src/metrics/metrics.entities";
import { SwapiController } from "../../src/swapi/swapi.controller";
import { SwapiService } from "../../src/swapi/swapi.service";
import { SwapiRepository } from "../../src/swapi/swapi.repository";
import { PersonMapper } from "../../src/swapi/mappers/person.mapper";
import { MovieMapper } from "../../src/swapi/mappers/movie.mapper";
import { MetricsInterceptor } from "../../src/metrics/metrics.interceptor";
import { MetricsBuffer } from "../../src/metrics/metrics.buffer";
import { MetricsService } from "../../src/metrics/metrics.service";
import { MetricsStore } from "../../src/metrics/metrics.store";
import { MetricsController } from "../../src/metrics/metrics.controller";
import { CacheService } from "../../src/cache/cache.service";

describe("Metrics Data Capture", () => {
  let app: INestApplication;
  let redisClient: {
    lpush: jest.Mock;
    get: jest.Mock;
    set: jest.Mock;
    lrange: jest.Mock;
    del: jest.Mock;
    multi: jest.Mock;
  };
  let requestMetricModel: {
    insertMany: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let metricReportModel: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let metricsService: MetricsService;

  beforeEach(async () => {
    // Mock Redis multi() transaction
    const multiMock = {
      lrange: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    redisClient = {
      lpush: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      lrange: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(1),
      multi: jest.fn().mockReturnValue(multiMock),
    };

    requestMetricModel = {
      insertMany: jest.fn().mockResolvedValue([]),
      find: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    metricReportModel = {
      findOne: jest.fn().mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      }),
      save: jest.fn().mockResolvedValue({}),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SwapiController, MetricsController],
      providers: [
        SwapiService,
        SwapiRepository,
        PersonMapper,
        MovieMapper,
        MetricsInterceptor,
        MetricsBuffer,
        MetricsService,
        MetricsStore,
        CacheService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockReturnValue(
              of({
                data: {
                  message: "ok",
                  result: {
                    uid: "1",
                    properties: {
                      name: "Luke Skywalker",
                      height: "172",
                      gender: "male",
                      birth_year: "19BBY",
                      eye_color: "blue",
                      hair_color: "blond",
                      mass: "77",
                      films: ["https://www.swapi.tech/api/films/1/"],
                    },
                  },
                },
              }),
            ),
          },
        },
        {
          provide: getRedisConnectionToken(),
          useValue: redisClient,
        },
        {
          provide: getQueueToken(METRICS_QUEUE),
          useValue: {
            add: jest.fn(),
            getWaiting: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getModelToken(RequestMetric.name),
          useValue: requestMetricModel,
        },
        {
          provide: getModelToken(MetricReport.name),
          useValue: metricReportModel,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    metricsService = moduleFixture.get<MetricsService>(MetricsService);
    await app.init();
  }, 10000); // Increase timeout

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    jest.clearAllMocks();
  });

  it("should push a metric to the Redis buffer when a tracked endpoint is called", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer()).get("/people/1?query=test").expect(200);

    expect(redisClient.lpush).toHaveBeenCalledTimes(1);
    expect(redisClient.lpush).toHaveBeenCalledWith(
      "metrics:batch",
      expect.any(String),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const metricString = redisClient.lpush.mock.calls[0][1] as string;
    const metric = JSON.parse(metricString) as {
      endpoint: string;
      query: string;
      statusCode: number;
      responseTime: number;
    };

    expect(metric).toMatchObject({
      endpoint: "GET /people/1",
      query: "query=test",
      statusCode: 200,
    });
    expect(metric.responseTime).toBeGreaterThanOrEqual(0);
  });

  it("should process batched metrics from Redis and store them in MongoDB", async () => {
    jest.clearAllMocks();

    const mockMetrics = [
      {
        endpoint: "GET /people/1",
        query: "query=test1",
        statusCode: 200,
        responseTime: 150,
        timestamp: Date.now(),
      },
      {
        endpoint: "GET /people/2",
        query: "query=test2",
        statusCode: 200,
        responseTime: 200,
        timestamp: Date.now(),
      },
      {
        endpoint: "GET /movies/1",
        query: "",
        statusCode: 404,
        responseTime: 75,
        timestamp: Date.now(),
      },
    ];

    const multiMock = {
      lrange: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, mockMetrics.map((m) => JSON.stringify(m))], // lrange result
        [null, 1], // del result
      ]),
    };
    redisClient.multi.mockReturnValue(multiMock);

    // Process the batched metrics
    await metricsService.processBatchedMetrics();

    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(multiMock.lrange).toHaveBeenCalledWith("metrics:batch", 0, -1);
    expect(multiMock.del).toHaveBeenCalledWith("metrics:batch");
    expect(multiMock.exec).toHaveBeenCalledTimes(1);

    expect(requestMetricModel.insertMany).toHaveBeenCalledTimes(1);
    expect(requestMetricModel.insertMany).toHaveBeenCalledWith([
      {
        endpoint: "GET /people/1",
        query: "query=test1",
        statusCode: 200,
        responseTime: 150,
        createdAt: expect.any(Date) as Date,
      },
      {
        endpoint: "GET /people/2",
        query: "query=test2",
        statusCode: 200,
        responseTime: 200,
        createdAt: expect.any(Date) as Date,
      },
      {
        endpoint: "GET /movies/1",
        query: "",
        statusCode: 404,
        responseTime: 75,
        createdAt: expect.any(Date) as Date,
      },
    ]);
  });

  it("should handle empty Redis buffer gracefully during batch processing", async () => {
    jest.clearAllMocks();

    // Multi mock for empty buffer
    const multiMock = {
      lrange: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, []], // empty lrange result
        [null, 0], // del result
      ]),
    };
    redisClient.multi.mockReturnValue(multiMock);

    await metricsService.processBatchedMetrics();

    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(multiMock.lrange).toHaveBeenCalledWith("metrics:batch", 0, -1);
    expect(multiMock.del).toHaveBeenCalledWith("metrics:batch");

    expect(requestMetricModel.insertMany).not.toHaveBeenCalled();
  });

  it("should generate report from MongoDB metrics and serve it via API endpoint", async () => {
    jest.clearAllMocks();

    // Existing metrics in MongoDB
    const existingMetrics = [
      {
        _id: "507f1f77bcf86cd799439011",
        endpoint: "GET /people/1",
        query: "query=luke",
        responseTime: 150,
        statusCode: 200,
        createdAt: new Date("2025-01-01T10:00:00Z"),
      },
      {
        _id: "507f1f77bcf86cd799439012",
        endpoint: "GET /people/2",
        query: "query=vader",
        responseTime: 200,
        statusCode: 200,
        createdAt: new Date("2025-01-01T11:00:00Z"),
      },
      {
        _id: "507f1f77bcf86cd799439013",
        endpoint: "GET /movies/1",
        query: "",
        responseTime: 75,
        statusCode: 404,
        createdAt: new Date("2025-01-01T12:00:00Z"),
      },
      {
        _id: "507f1f77bcf86cd799439014",
        endpoint: "GET /people/1",
        query: "query=luke",
        responseTime: 120,
        statusCode: 200,
        createdAt: new Date("2025-01-01T13:00:00Z"),
      },
    ];

    requestMetricModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingMetrics),
    });

    metricReportModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    // Mock the MetricsStore.insertReport method to capture the report data
    const metricsStore = app.get<MetricsStore>(MetricsStore);
    let capturedReport: Record<string, any> = {};
    jest
      .spyOn(metricsStore, "insertReport")
      .mockImplementation((reportData) => {
        capturedReport = {
          ...reportData,
          _id: "507f1f77bcf86cd799439020",
          createdAt: new Date(),
        };
        return Promise.resolve();
      });

    await metricsService.generateReport();

    expect(capturedReport).toBeDefined();
    expect(capturedReport?.totalRequests).toBe(4);
    expect(capturedReport?.avgResponseTime).toBe((150 + 200 + 75 + 120) / 4); // 136.25
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    expect(capturedReport?.lastProcessedMetricId?.toString()).toBe(
      "507f1f77bcf86cd799439014",
    );

    expect(capturedReport.topQueries).toEqual(
      expect.arrayContaining([
        {
          endpoint: "GET /people/1",
          query: "query=luke",
          count: 2,
          percentage: 50,
        },
        {
          endpoint: "GET /people/2",
          query: "query=vader",
          count: 1,
          percentage: 25,
        },
        {
          endpoint: "GET /movies/1",
          query: "",
          count: 1,
          percentage: 25,
        },
      ]),
    );

    // Verify hourly distribution (based on actual hours in local timezone)
    expect(capturedReport.hourlyDistribution).toHaveLength(4);
    expect(capturedReport.hourlyDistribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ count: 1 }),
        expect.objectContaining({ count: 1 }),
        expect.objectContaining({ count: 1 }),
        expect.objectContaining({ count: 1 }),
      ]),
    );

    // Mock the store to return our captured report
    jest
      .spyOn(metricsStore, "fetchLastReport")
      .mockResolvedValue(capturedReport as MetricReportDocument);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(app.getHttpServer())
      .get("/metrics/report")
      .expect(200);

    // API returns the generated report
    expect(response.body).toMatchObject({
      totalRequests: 4,
      avgResponseTime: 136.25,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      topQueries: expect.arrayContaining([
        expect.objectContaining({
          endpoint: "GET /people/1",
          query: "query=luke",
          count: 2,
        }),
      ]),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      hourlyDistribution: expect.arrayContaining([
        expect.objectContaining({ count: 1 }),
      ]),
    });
  });
});
