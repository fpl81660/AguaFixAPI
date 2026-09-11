import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsIn(['baja', 'media', 'alta'], {
    message: 'La severidad debe ser: baja, media, alta',
  })
  severity: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  reporterPhone: string;
}
