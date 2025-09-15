import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Event } from "./event";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column()
  accessToken!: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @OneToMany(() => Event, (event) => event.user)
  events!: Event[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
