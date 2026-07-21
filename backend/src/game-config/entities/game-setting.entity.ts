import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class GameSetting {
  @PrimaryColumn()
  key!: string;

  @Column('text')
  valueJson!: string;
}
