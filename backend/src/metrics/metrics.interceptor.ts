import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        const endpoint = `${request.method} ${request.url.split("?")[0]}`;
        const query = new URLSearchParams(
          request.url.split("?")[1] || "",
        ).toString();

        // Fire and forget without awaiting
        this.metricsService
          .recordQuery({
            endpoint,
            query,
            responseTime,
            timestamp: startTime,
            statusCode: response.statusCode,
          })
          // Silently ignore errors
          .catch(() => {});
      }),
    );
  }
}
