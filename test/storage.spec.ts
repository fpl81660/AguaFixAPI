import 'reflect-metadata';
import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ServiceUnavailableException } from '@nestjs/common';
import { StorageService } from '../src/storage/storage.service.js';
import { generateReportTemplate } from '../src/reports/templates/report.template.js';

describe('StorageService', () => {
  afterEach(() => mock.restoreAll());

  it('sube el buffer y ContentType con claves únicas y devuelve una URL pública', async () => {
    const commands: PutObjectCommand[] = [];
    mock.method(
      S3Client.prototype,
      'send',
      async (command: PutObjectCommand) => {
        commands.push(command);
        return {};
      },
    );
    const file = {
      buffer: Buffer.from('mock image'),
      mimetype: 'image/png',
      originalname: '../../unsafe.png',
    } as Express.Multer.File;
    const storageService = new StorageService();
    const first = await storageService.uploadFile(file, 'reports/');
    const second = await storageService.uploadFile(file, 'reports/');
    assert.notEqual(first, second);
    assert.match(
      first,
      /^https:\/\/aguafix-test\.s3\.us-east-1\.amazonaws\.com\/reports\/[a-f0-9-]+\.png$/,
    );
    assert.ok(commands[0] instanceof PutObjectCommand);
    assert.equal(commands[0].input.Body, file.buffer);
    assert.equal(commands[0].input.ContentType, 'image/png');
    assert.equal(commands[0].input.Bucket, 'aguafix-test');
    assert.equal(commands[0].input.ACL, undefined);
  });

  it('transforma fallos del SDK sin revelar detalles de AWS', async () => {
    mock.method(S3Client.prototype, 'send', async () => {
      throw new Error('private AWS details');
    });
    await assert.rejects(
      new StorageService().uploadFile(
        {
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg',
        } as Express.Multer.File,
        'reports/',
      ),
      ServiceUnavailableException,
    );
  });
});

it('generateReportTemplate conserva los datos, incluye la imagen y escapa HTML', () => {
  const html = generateReportTemplate(
    {
      address: '<script>test</script>',
      description: 'Fuga & agua',
      severity: 'alta',
      reporterPhone: '5551234567',
    },
    'https://example.test/photo.png?x="test"',
  );
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('Fuga &amp; agua'));
  assert.ok(html.includes('ALTA'));
  assert.ok(html.includes('5551234567'));
  assert.ok(
    html.includes(
      '<img src="https://example.test/photo.png?x=&quot;test&quot;"',
    ),
  );
});
