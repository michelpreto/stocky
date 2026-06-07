# AlmoxControl — Deploy Zima OS + Cloudflare Tunnel · Design Spec

**Data:** 2026-06-07  
**Status:** Aprovado  
**Fase do produto:** MVP (v0.1) — deploy com banco real  
**Referência:** `almoxcontrol-CLAUDE.md` §2.3 (Stack Técnica)

---

## 1. Objetivo

Disponibilizar o AlmoxControl em servidor doméstico Zima OS com acesso pela internet via Cloudflare Tunnel, sem depender de IP fixo e sem abrir portas no roteador. O deploy inclui PostgreSQL como banco de dados real, substituindo os dados mockados da fase de desenvolvimento.

**Pré-condição:** módulo de banco de dados (Prisma schema + API routes) deve estar implementado antes de executar este plano. Este spec cobre exclusivamente a infra de hospedagem.

---

## 2. Arquitetura

### 2.1 Containers (Docker Compose)

Três serviços no mesmo `docker-compose.yml`:

| Serviço | Imagem | Porta interna | Exposto externamente |
|---------|--------|---------------|----------------------|
| `app` | build local (Dockerfile) | 3000 | Não — só via cloudflared |
| `postgres` | postgres:16-alpine | 5432 | Não — rede Docker interna |
| `cloudflared` | cloudflare/cloudflared:latest | — | Conexão de saída ao Cloudflare |

```
Internet → Cloudflare Edge (HTTPS) → Tunnel → cloudflared → app:3000
                                                                  ↓
                                                           postgres:5432
                                                        (rede Docker interna)
```

### 2.2 Por que Cloudflare Tunnel

- Funciona com **IP dinâmico** — o servidor não precisa de IP fixo
- Funciona atrás de **CGNAT** (comum em operadoras brasileiras)
- Sem abertura de portas no roteador
- HTTPS automático com certificado válido (gerenciado pelo Cloudflare)
- Conexão de **saída** — o servidor inicia o túnel, não recebe conexões diretas
- Gratuito no plano Free do Cloudflare

---

## 3. Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> Requer `output: 'standalone'` no `next.config.ts` para gerar o bundle otimizado de produção.

---

## 4. docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NODE_ENV: production
    ports:
      - "127.0.0.1:3000:3000"   # só localhost — acesso externo só via tunnel

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - app

volumes:
  postgres_data:
```

---

## 5. Variáveis de ambiente

Arquivo `.env` criado **manualmente no servidor** — nunca versionado:

```env
# PostgreSQL
POSTGRES_USER=almox
POSTGRES_PASSWORD=<gerado: openssl rand -base64 32>
POSTGRES_DB=almoxcontrol
DATABASE_URL=postgresql://almox:<senha>@postgres:5432/almoxcontrol

# Next.js
NEXTAUTH_SECRET=<gerado: openssl rand -base64 32>
NEXTAUTH_URL=https://almox.seudominio.com.br
NODE_ENV=production

# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_TOKEN=<obtido no Zero Trust dashboard>
```

`.gitignore` deve conter `.env` e `.env.local`.

---

## 6. Configuração do Cloudflare Tunnel (passo a passo)

1. Acessar **Cloudflare Zero Trust** → Networks → Tunnels → Create tunnel
2. Tipo: **Cloudflared** → dar um nome (ex: `almoxcontrol-home`)
3. Copiar o token gerado → colocar em `CLOUDFLARE_TUNNEL_TOKEN` no `.env`
4. Em **Public Hostname**:
   - Subdomain: `almox` (ou o que preferir)
   - Domain: `seudominio.com.br`
   - Service: `http://app:3000`
5. Salvar — o Cloudflare cria automaticamente o registro DNS `CNAME` apontando para o túnel

---

## 7. Workflow de deploy

### 7.1 Setup inicial (uma vez)

```bash
# No servidor Zima OS via SSH
git clone https://github.com/michelpreto/stocky ~/stocky
cd ~/stocky

# Criar .env com os valores reais
nano .env

# Subir os containers
docker compose up -d

# Rodar migrações do banco
docker compose exec app npx prisma migrate deploy
```

### 7.2 Atualização do app

```bash
cd ~/stocky
git pull
docker compose build app
docker compose up -d app   # só reinicia o app; postgres e cloudflared ficam no ar
```

### 7.3 Migrações de banco (quando há schema novo)

```bash
docker compose exec app npx prisma migrate deploy
```

Migrações **nunca** rodam automaticamente no startup — sempre são explícitas para evitar acidente.

### 7.4 Verificação pós-deploy

```bash
docker compose ps                          # todos os serviços Up
docker compose logs app --tail=50          # checar erros do Next.js
docker compose logs cloudflared --tail=20  # checar conexão do túnel
```

---

## 8. Alteração no `next.config.ts`

Adicionar `output: 'standalone'` para gerar bundle otimizado:

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

---

## 9. Segurança

| Preocupação | Solução |
|-------------|---------|
| Secrets no repositório | `.env` nunca versionado; `.gitignore` com `.env*` |
| Banco acessível externamente | `postgres` sem porta exposta no compose; só rede interna |
| HTTP plain | Cloudflare Tunnel gerencia HTTPS com certificado automático |
| IP do servidor exposto | Túnel de saída — Cloudflare nunca revela o IP real |
| Credenciais fracas | Senhas geradas com `openssl rand -base64 32` |

---

## 10. Estrutura de arquivos no servidor

```
~/stocky/
├── .env                    ← secrets (não versionado, criado manualmente)
├── docker-compose.yml      ← versionado no GitHub
├── Dockerfile              ← versionado no GitHub
└── (restante do repositório)
```

---

## 11. Pré-requisitos no servidor Zima OS

- Docker + Docker Compose instalados (padrão no Zima OS)
- Git instalado (`apt install git` ou via interface Zima)
- Acesso SSH ao servidor
- Conta Cloudflare com domínio adicionado e plano Free ativo
