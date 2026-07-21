import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  actorUserId: number;

  @Column()
  actorEmail: string;

  @Column()
  action: string;

  @Column()
  targetType: string;

  @Column({ nullable: true })
  targetId: string;

  @Column({ type: 'text', nullable: true })
  detailsJson: string;

  @CreateDateColumn()
  createdAt: Date;
}
