import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ServiceUnavailableException,
  ValidationPipe,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { ReportsModule } from '../src/reports/reports.module.js';
import { AuthModule } from '../src/auth/auth.module.js';
import { Report } from '../src/reports/entities/report.entity.js';
import { User } from '../src/auth/entities/user.entity.js';
import { StorageService } from '../src/storage/storage.service.js';
import { EmailService } from '../src/email/email.service.js';

const photo = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4xsAAAAASUVORK5CYII=',
  'base64',
);
const photoUrl =
  'https://aguafix-test.s3.us-east-1.amazonaws.com/reports/example.png';
const dto = {
  address: 'Calle 1',
  description: 'Fuga frente al parque',
  severity: 'alta',
  reporterPhone: '5551234567',
};

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let reports: Report[];
  let users: User[];
  let events: string[];
  let emails: unknown[][];
  let uploadFails: boolean;
  let emailFails: boolean;

  beforeEach(async () => {
    reports = [];
    users = [];
    events = [];
    emails = [];
    uploadFails = false;
    emailFails = false;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ReportsModule, AuthModule],
    })
      .overrideProvider(getRepositoryToken(Report))
      .useValue({
        create: (value: Partial<Report>) => ({ isResolved: false, ...value }),
        save: async (value: Report) => {
          events.push('save');
          Object.assign(value, {
            id: reports.length + 1,
            createdAt: new Date(),
          });
          reports.push(value);
          return value;
        },
        find: async (options: unknown) => {
          assert.deepEqual(options, { order: { createdAt: 'DESC' } });
          return [...reports].reverse();
        },
      })
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        findOne: async ({ where }: { where: { email: string } }) =>
          users.find((value) => value.email === where.email) ?? null,
        create: (value: User) => value,
        save: async (value: User) => {
          users.push(value);
          return value;
        },
      })
      .overrideProvider(StorageService)
      .useValue({
        uploadFile: async (file: Express.Multer.File, folder: string) => {
          events.push('upload');
          assert.equal(folder, 'reports/');
          assert.equal(file.mimetype, 'image/png');
          if (uploadFails)
            throw new ServiceUnavailableException('S3 no disponible');
          return photoUrl;
        },
      })
      .overrideProvider(EmailService)
      .useValue({
        sendEmail: async (...args: unknown[]) => {
          events.push('email');
          emails.push(args);
          return !emailFails;
        },
      })
      .compile();
    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('crea un reporte, guarda las URLs y envía el correo después de guardar', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/reports')
      .field(dto)
      .attach('photo', photo, {
        filename: 'fuga.png',
        contentType: 'image/png',
      })
      .expect(201);
    assert.equal(result.body.photoUrl, photoUrl);
    assert.equal(result.body.repairPhotoUrl, null);
    assert.equal(result.body.address, dto.address);
    assert.deepEqual(events, ['upload', 'save', 'email']);
    assert.equal(emails[0][0], 'crew@example.test');
    assert.match(String(emails[0][2]), /<img src="https:\/\/aguafix-test/);
    const listing = await request(app.getHttpServer())
      .get('/api/reports')
      .expect(200);
    assert.equal(listing.body[0].photoUrl, photoUrl);
    assert.equal(listing.body[0].repairPhotoUrl, null);
  });

  it('devuelve los campos nullable de los reportes anteriores', async () => {
    reports.push({
      ...dto,
      id: 1,
      isResolved: false,
      createdAt: new Date(),
      photoUrl: null,
      repairPhotoUrl: null,
    });
    const result = await request(app.getHttpServer())
      .get('/api/reports')
      .expect(200);
    assert.equal(result.body[0].photoUrl, null);
    assert.equal(result.body[0].repairPhotoUrl, null);
  });

  it('rechaza multipart y JSON sin photo antes de subir o guardar', async () => {
    await request(app.getHttpServer())
      .post('/api/reports')
      .field(dto)
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/reports')
      .send(dto)
      .expect(400);
    assert.deepEqual(events, []);
  });

  it('rechaza un archivo de texto aunque declare ser PNG', async () => {
    await request(app.getHttpServer())
      .post('/api/reports')
      .field(dto)
      .attach('photo', Buffer.from('Esto no es una foto'), {
        filename: 'fuga.png',
        contentType: 'image/png',
      })
      .expect(400);
    assert.deepEqual(events, []);
  });

  it('rechaza archivos mayores de 5 MiB sin subirlos', async () => {
    await request(app.getHttpServer())
      .post('/api/reports')
      .field(dto)
      .attach('photo', Buffer.alloc(5 * 1024 * 1024 + 1), 'fuga.png')
      .expect(413);
    assert.deepEqual(events, []);
  });

  it('acepta exactamente 5 MiB y usa el tipo detectado del contenido', async () => {
    const maximumPhoto = Buffer.alloc(5 * 1024 * 1024);
    photo.copy(maximumPhoto);
    await request(app.getHttpServer())
      .post('/api/reports')
      .field(dto)
      .attach('photo', maximumPhoto, {
        filename: 'foto.bin',
        contentType: 'application/octet-stream',
      })
      .expect(201);
    assert.deepEqual(events, ['upload', 'save', 'email']);
  });

  it('rechaza un campo de archivo diferente y múltiples fotos', async () => {
    await request(app.getHttpServer())
      .post('/api/reports')
      .field(dto)
      .attach('file', photo, 'fuga.png')
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/reports')
      .field(dto)
      .attach('photo', photo, 'uno.png')
      .attach('photo', photo, 'dos.png')
      .expect(400);
    assert.deepEqual(events, []);
  });

  it('conserva la validación de severidad y teléfono y rechaza campos adicionales', async () => {
    for (const invalid of [
      { ...dto, severity: 'extrema' },
      { ...dto, reporterPhone: '1'.repeat(21) },
      { ...dto, photoUrl: 'https://example.test' },
    ]) {
      await request(app.getHttpServer())
        .post('/api/reports')
        .field(invalid)
        .attach('photo', photo, 'fuga.png')
        .expect(400);
    }
    assert.deepEqual(events, []);
  });

  it('no guarda ni envía correo si falla S3', async () => {
    uploadFails = true;
    await request(app.getHttpServer())
      .post('/api/reports')
      .field(dto)
      .attach('photo', photo, 'fuga.png')
      .expect(503);
    assert.deepEqual(events, ['upload']);
    assert.equal(reports.length, 0);
  });

  it('conserva el reporte si el servicio de correo devuelve false', async () => {
    emailFails = true;
    await request(app.getHttpServer())
      .post('/api/reports')
      .field(dto)
      .attach('photo', photo, 'fuga.png')
      .expect(201);
    assert.equal(reports.length, 1);
  });

  it('mantiene registro, hash de contraseña e inicio de sesión', async () => {
    const user = {
      name: 'Ciudadano',
      email: 'citizen@example.test',
      password: 'test-password',
    };
    const registered = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(user)
      .expect(201);
    assert.equal(registered.body.password, undefined);
    assert.notEqual(users[0].password, user.password);
    const loggedIn = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(201);
    assert.equal(loggedIn.body.user.email, user.email);
    assert.equal(loggedIn.body.user.password, undefined);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(user)
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...user, email: 'invalid', password: 'short' })
      .expect(400);
  });
});
