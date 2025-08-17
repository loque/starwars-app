import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { MetricsBuffer } from "./metrics.buffer";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly buffer: MetricsBuffer) {}

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
        this.buffer
          .addMetric({
            endpoint,
            query,
            responseTime,
            timestamp: startTime,
            statusCode: response.statusCode,
          })
          .catch((error) => {
            // Avoid blocking the request with an error
            this.logger.error("Failed to record metric", error);
          });
      }),
    );
  }
}
