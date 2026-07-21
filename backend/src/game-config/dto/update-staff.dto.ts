import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateStaffDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsNumber()
  @Min(0)
  baseCost!: number;

  @IsNumber()
  @Min(0)
  baseProfit!: number;

  @IsNumber()
  @Min(0)
  costGrowth!: number;

  @IsInt()
  @Min(1)
  maxCount!: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsInt()
  sortOrder!: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
