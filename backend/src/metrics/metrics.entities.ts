import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("query_stats")
@Index(["endpoint", "query"], { unique: true })
export class QueryStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  endpoint: string;

  @Column()
  query: string;

  @Column({ default: 0 })
  count: number;

  @Column("bigint", { default: 0 })
  totalResponseTime: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  avgResponseTime: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("hourly_stats")
@Index(["hour", "date"], { unique: true })
export class HourlyStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hour: number; // 0-23

  @Column()
  date: string; // YYYY-MM-DD

  @Column({ default: 0 })
  requestCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
