import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema()
export class RequestMetric {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  endpoint: string;

  @Prop({ type: String, default: "" })
  query: string;

  @Prop({ type: Number, default: 0 })
  responseTime: number;

  @Prop({ type: Number, required: true })
  statusCode: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export type RequestMetricDocument = HydratedDocument<RequestMetric>;
export const RequestMetricSchema = SchemaFactory.createForClass(RequestMetric);
export type RequestMetricDto = Omit<RequestMetric, "id" | "createdAt"> & {
  timestamp: number;
};
