# Backend — Chinese Learning API

Node.js + Express + TypeScript + MongoDB.

## Docker

```bash
cp .env.example .env
docker compose up --build -d
```

- API: http://localhost:5000/api/health
- Tạo network Docker `chinese-learning` (frontend join network này)
- MongoDB không publish cổng ra host
- Volume: `mongodb_data`, `audio_data`

```bash
docker compose logs -f
docker compose down
docker compose down -v   # xóa data
```

## Local (không Docker)

Cần MongoDB riêng (hoặc chỉ chạy service `mongodb` trong compose).

```bash
cp .env.example .env
# chỉnh MONGODB_URI / CORS_ORIGIN / AUDIO_DIR cho local
npm install
npm run dev
npm test
```

## Backup

```bash
docker compose exec -T mongodb mongodump --archive --db chinese_learning > backup-mongo.archive
docker compose exec -T mongodb mongorestore --archive --drop < backup-mongo.archive
```
