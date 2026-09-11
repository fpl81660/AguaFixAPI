import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('WATER_REPORT')
export class Report {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  address: string;

  @Column('text')
  description: string;

  @Column()
  severity: string;

  @Column()
  reporterPhone: string;

  @Column({ default: false })
  isResolved: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
