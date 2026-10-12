import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.PORT = '5000';

let app: Awaited<ReturnType<typeof import('../src/app.js').createApp>>;
let mongo: MongoMemoryServer;
let audioDir: string;

beforeAll(async () => {
  audioDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chinese-audio-'));
  process.env.AUDIO_DIR = audioDir;
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test';

  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);

  const { createApp } = await import('../src/app.js');
  app = await createApp();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
  await fs.rm(audioDir, { recursive: true, force: true });
});

describe('API CRUD and search', () => {
  it('starts with empty items and healthy endpoint', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.success).toBe(true);

    const list = await request(app).get('/api/items');
    expect(list.status).toBe(200);
    expect(list.body.data.items).toEqual([]);
    expect(list.body.data.pagination.total).toBe(0);
  });

  it('creates, updates, searches and deletes items', async () => {
    const created = await request(app).post('/api/items').send({
      type: 'word',
      hanzi: '你好',
      pinyin: 'nǐ hǎo',
      meaningVi: 'xin chào',
      pronunciationLanguage: 'zh-CN',
      tags: ['greeting'],
      source: 'phim A',
    });
    expect(created.status).toBe(201);
    expect(created.body.data.hanzi).toBe('你好');
    const id = created.body.data._id;

    const updated = await request(app).patch(`/api/items/${id}`).send({
      meaningVi: 'chào bạn',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.meaningVi).toBe('chào bạn');

    const search = await request(app).get('/api/items').query({ q: 'chào' });
    expect(search.body.data.items).toHaveLength(1);

    const filtered = await request(app).get('/api/items').query({ tag: 'greeting', type: 'word' });
    expect(filtered.body.data.items).toHaveLength(1);

    const removed = await request(app).delete(`/api/items/${id}`);
    expect(removed.status).toBe(200);

    const missing = await request(app).get(`/api/items/${id}`);
    expect(missing.status).toBe(404);
  });

  it('does not invent pinyin or meaning when empty', async () => {
    const created = await request(app).post('/api/items').send({
      type: 'phrase',
      hanzi: '谢谢',
    });
    expect(created.status).toBe(201);
    expect(created.body.data.pinyin).toBe('');
    expect(created.body.data.meaningVi).toBe('');
  });
});

describe('Audio upload', () => {
  it('uploads, plays and deletes audio', async () => {
    const created = await request(app).post('/api/items').send({
      type: 'sentence',
      hanzi: '我喜欢学中文',
    });
    const id = created.body.data._id;
    const tmpFile = path.join(audioDir, 'sample.webm');
    await fs.writeFile(tmpFile, Buffer.from('fake-audio-content'));

    const uploaded = await request(app)
      .post(`/api/items/${id}/audio`)
      .attach('audio', tmpFile, { contentType: 'audio/webm', filename: 'sample.webm' });
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.data.audioRecordingPath).toBeTruthy();

    const played = await request(app).get(`/api/items/${id}/audio`);
    expect(played.status).toBe(200);
    expect(played.headers['content-type']).toContain('audio/webm');

    const deleted = await request(app).delete(`/api/items/${id}/audio`);
    expect(deleted.status).toBe(200);

    const missing = await request(app).get(`/api/items/${id}/audio`);
    expect(missing.status).toBe(404);
  });
});

describe('Reviews and import/export', () => {
  it('completes review and updates due date', async () => {
    const created = await request(app).post('/api/items').send({
      type: 'word',
      hanzi: '水',
      meaningVi: 'nước',
    });
    const id = created.body.data._id;

    const dueBefore = await request(app).get('/api/reviews/due');
    expect(dueBefore.body.data.length).toBeGreaterThanOrEqual(1);

    const completed = await request(app)
      .post(`/api/reviews/${id}/complete`)
      .send({ rating: 'good' });
    expect(completed.status).toBe(200);
    expect(completed.body.data.review.reviewCount).toBe(1);
    expect(completed.body.data.review.intervalDays).toBe(1);

    const stats = await request(app).get('/api/stats');
    expect(stats.body.data.totalItems).toBe(1);
    expect(stats.body.data.totalReviews).toBe(1);
  });

  it('exports and imports JSON without unintended duplicates', async () => {
    await request(app).post('/api/items').send({
      type: 'word',
      hanzi: '书',
      meaningVi: 'sách',
    });

    const exported = await request(app).get('/api/export');
    expect(exported.status).toBe(200);
    expect(exported.body.data.items).toHaveLength(1);

    const payload = {
      version: 1,
      mode: 'merge',
      items: exported.body.data.items.map((item: { id: string; type: string; hanzi: string; meaningVi: string }) => ({
        id: item.id,
        type: item.type,
        hanzi: item.hanzi,
        meaningVi: item.meaningVi,
      })),
    };

    const imported = await request(app).post('/api/import').send(payload);
    expect(imported.status).toBe(201);
    expect(imported.body.data.skipped).toBe(1);
    expect(imported.body.data.created).toBe(0);

    const list = await request(app).get('/api/items');
    expect(list.body.data.pagination.total).toBe(1);
  });
});
