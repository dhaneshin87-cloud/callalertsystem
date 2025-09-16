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

  @Column({ nullable: true })
  accessToken?: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @OneToMany(() => Event, (event) => event.user)
  events!: Event[];
}
