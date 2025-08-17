import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema()
export class RequestMetric {
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: String, required: true })
  endpoint: string;

  @Prop({ type: String, default: "" })
  query: string;

  @Prop({ type: Number, default: 0 })
  responseTime: number;

  @Prop({ type: Number, required: true })
  statusCode: number;
}

export type RequestMetricDocument = HydratedDocument<RequestMetric>;
export const RequestMetricSchema = SchemaFactory.createForClass(RequestMetric);
export type RequestMetricDto = Omit<RequestMetric, "id" | "createdAt"> & {
  timestamp: number;
};

export type TopQuery = {
  endpoint: string;
  query: string;
  count: number;
  percentage: number;
};
export type HourlyDistribution = { hour: number; count: number };

@Schema()
export class MetricReport {
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: "RequestMetric" })
  lastProcessedMetricId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  totalRequests: number;

  @Prop({ type: Number, required: true })
  avgResponseTime: number;

  @Prop({ type: [Object], required: true })
  topQueries: TopQuery[];

  @Prop({ type: [Object], required: true })
  hourlyDistribution: HourlyDistribution[];
}

export type MetricReportDocument = HydratedDocument<MetricReport>;
export const MetricReportSchema = SchemaFactory.createForClass(MetricReport);
export type MetricReportInsert = Omit<MetricReport, "createdAt">;
