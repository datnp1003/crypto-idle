import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class StaffModule {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column('real')
  baseCost!: number;

  @Column('real')
  baseProfit!: number;

  @Column('real')
  costGrowth!: number;

  @Column('int')
  maxCount!: number;

  @Column({ nullable: true, default: '' })
  icon!: string;

  @Column('int')
  sortOrder!: number;

  @Column({ default: true })
  enabled!: boolean;
}
