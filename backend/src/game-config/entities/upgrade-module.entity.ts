import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class UpgradeModule {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column('real')
  baseCost!: number;

  @Column('real')
  costGrowth!: number;

  @Column({ nullable: true, default: 'generic' })
  costFormula!: string;

  @Column('int')
  maxLevel!: number;

  @Column({ nullable: true, default: '' })
  icon!: string;

  @Column('int')
  sortOrder!: number;

  @Column({ default: true })
  enabled!: boolean;
}
