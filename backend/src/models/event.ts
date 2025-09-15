import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  date!: string;

  @Column()
  endDate!: string;

  @Column()
  phoneNumber!: string;

  @Column()
  email!: string;

  @Column()
  googleEventId!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.events)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
