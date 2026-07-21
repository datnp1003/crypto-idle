import { IsEmail, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsEmail({ require_tld: false })
  email: string;

  @MinLength(8)
  password: string;
}
