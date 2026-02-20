# TAK Deployment Guide

## Quick Start (Local Development)

```bash
# 1. Start the server
cd tak/tak-server
npm install
npm start

# 2. Server runs on http://localhost:3000

# 3. Verify health
curl http://localhost:3000/health

# 4. Run example flow
node ../examples/quickstart.js
```

---

## Docker Deployment

### Build Image

```bash
cd tak/tak-server
docker build -t tak-server:latest .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e MCP_ADAPTER=mock \
  tak-server:latest
```

### Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  tak-server:
    build:
      context: ./tak/tak-server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MCP_ADAPTER=mock
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
```

Deploy:

```bash
docker-compose up -d
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp tak/tak-server/.env.example tak/tak-server/.env
```

Configure:

```
NODE_ENV=production
PORT=3000
MCP_ADAPTER=mock        # or 'ton' for TON blockchain
SCHEMA_VERSION=tak/0.1
LOG_LEVEL=info
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use custom `MCP_ADAPTER` (not just mock)
- [ ] Enable logging/monitoring
- [ ] Set up database backups (SQLite)
- [ ] Configure CORS for your domain
- [ ] Use HTTPS in production
- [ ] Monitor /health endpoint
- [ ] Set up alerting for deal failures

---

## Scaling

TAK is stateless (all state in SQLite). Scale horizontally:

```bash
# Multiple servers share same database
docker-compose up -d --scale tak-server=3
```

Use a load balancer (nginx, AWS ELB) in front.

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Deal Completion Rate

```bash
sqlite3 tak.db "SELECT status, COUNT(*) FROM deals GROUP BY status;"
```

### Request Metrics

```bash
sqlite3 tak.db "SELECT AVG(JULIANDAY('now') - JULIANDAY(created_at)) AS avg_duration_hours FROM deals WHERE status='executed';"
```

---

## Backup & Recovery

### Backup Database

```bash
# SQLite backup (safe during operation)
sqlite3 tak.db ".backup tak.db.backup"

# Or use system tools
cp tak.db tak.db.backup
```

### Restore

```bash
cp tak.db.backup tak.db
```

---

## Troubleshooting

### Port Already in Use

```bash
lsof -i :3000
kill -9 <PID>
```

### Database Locked

```bash
# Remove WAL files
rm tak.db-wal tak.db-shm
# Restart
npm start
```

### Health Check Failing

```bash
curl -v http://localhost:3000/health
# Check server logs
tail npm-debug.log
```

---

## Integration with TON Network

### Phase 1: Development (Current)
- MCPAdapter: `MockMCPAdapter`
- Returns fake receipts
- No blockchain required

### Phase 2: Testnet
- MCPAdapter: `TONMCPAdapter`
- Testnet RPC endpoint
- Real transactions on testnet

### Phase 3: Mainnet
- MCPAdapter: `TONMCPAdapter`
- Mainnet RPC endpoint
- Production settlement

---

## Next Steps

1. **Deploy to cloud** (Render, Railway, Heroku)
2. **Configure TONMCPAdapter** for your blockchain endpoint
3. **Enable authentication** (JWT or API keys)
4. **Add database replication** for high availability
5. **Set up CI/CD** for automated deployments
