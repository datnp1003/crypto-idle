import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateUpgradeDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  baseCost!: number;

  @IsNumber()
  @Min(0)
  costGrowth!: number;

  @IsOptional()
  @IsString()
  costFormula?: string;

  @IsInt()
  @Min(1)
  maxLevel!: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsInt()
  sortOrder!: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
