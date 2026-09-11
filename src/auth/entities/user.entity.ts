import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('SYSTEM_USER')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column({ default: true })
  isNotificationEnabled: boolean;
}
