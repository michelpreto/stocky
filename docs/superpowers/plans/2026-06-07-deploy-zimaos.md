# AlmoxControl — Deploy Zima OS + Cloudflare Tunnel · Implementation Plan

> **For agentic workers:** Tasks 1–5 podem ser executadas com superpowers:subagent-driven-development (mudanças no repositório). Tasks 6–10 são manuais — requerem SSH no servidor Zima OS e acesso ao painel Cloudflare. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar o AlmoxControl em produção em servidor doméstico Zima OS com banco PostgreSQL e acesso externo via `https://stocky.mpmserver.com.br` (Cloudflare Tunnel).

**Architecture:** Três containers Docker Compose no servidor: `app` (Next.js 16 standalone build), `postgres` (PostgreSQL 16) e `cloudflared` (Cloudflare Tunnel). O túnel roteia tráfego HTTPS do Cloudflare para o container app sem abrir portas no roteador.

**Tech Stack:** Docker · Docker Compose v2 · Next.js 16 standalone · PostgreSQL 16 · Cloudflare Tunnel (cloudflared) · Prisma ORM

> ⚠️ **Pré-condição:** O módulo de banco de dados (Prisma schema + migrations + API routes) deve estar implementado e testado antes de executar as Tasks 6–10 (deploy no servidor). As Tasks 1–5 (arquivos de infra no repo) podem ser feitas a qualquer momento.

---

## File Map

| Arquivo | Responsabilidade |
|---------|-----------------|
| `next.config.ts` | Adicionar `output: 'standalone'` para build otimizado de produção |
| `Dockerfile` | Multi-stage build: compila o app e gera imagem de produção mínima |
| `docker-compose.yml` | Orquestra os 3 serviços: app, postgres, cloudflared |
| `.dockerignore` | Exclui node_modules e .next do contexto de build do Docker |
| `.env.example` | Template de variáveis de ambiente sem valores reais |

---

## Task 1: Atualizar `next.config.ts`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Adicionar `output: 'standalone'`**

Substitua o conteúdo de `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 2: Verificar que o build local ainda funciona**

```bash
npm run build
```

Esperado: `✓ Compiled successfully` com uma linha `Route (app)` para cada rota. Verifique que o diretório `.next/standalone/` foi criado:

```bash
ls .next/standalone/
```

Esperado: arquivo `server.js` presente.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: add standalone output for Docker production build"
```

---

## Task 2: Criar `.dockerignore`

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Criar o arquivo**

```
node_modules
.next
.git
.gitignore
*.md
.env*
coverage
__tests__
docs
design-system
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore"
```

---

## Task 3: Criar `Dockerfile`

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Criar o arquivo**

```dockerfile
# Stage 1: dependências e build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: imagem de produção mínima
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copia apenas o output standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 2: Verificar que o build Docker funciona localmente**

```bash
docker build -t almoxcontrol-test .
```

Esperado: `Successfully built <id>` sem erros. Pode demorar 2-3 min na primeira vez.

- [ ] **Step 3: Testar a imagem localmente (opcional mas recomendado)**

```bash
docker run --rm -p 3000:3000 \
  -e NEXTAUTH_SECRET=test-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  almoxcontrol-test
```

Abrir `http://localhost:3000` — o app deve carregar (ainda com mock data, sem banco).

Encerrar com `Ctrl+C`.

- [ ] **Step 4: Remover imagem de teste**

```bash
docker rmi almoxcontrol-test
```

- [ ] **Step 5: Commit**

```bash
git add Dockerfile
git commit -m "feat: Dockerfile — multi-stage build for production"
```

---

## Task 4: Criar `docker-compose.yml`

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Criar o arquivo**

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
    networks:
      - internal

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
      - "127.0.0.1:3000:3000"
    networks:
      - internal

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - app
    networks:
      - internal

volumes:
  postgres_data:

networks:
  internal:
    driver: bridge
```

- [ ] **Step 2: Validar sintaxe do compose**

```bash
docker compose config
```

Esperado: output do YAML sem mensagem de erro.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: docker-compose — app + postgres + cloudflared"
```

---

## Task 5: Criar `.env.example` e fazer push

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Criar o arquivo template**

```env
# PostgreSQL
POSTGRES_USER=almox
POSTGRES_PASSWORD=GERAR_COM_openssl_rand_base64_32
POSTGRES_DB=almoxcontrol
DATABASE_URL=postgresql://almox:SENHA_AQUI@postgres:5432/almoxcontrol

# Next.js
NEXTAUTH_SECRET=GERAR_COM_openssl_rand_base64_32
NEXTAUTH_URL=https://stocky.mpmserver.com.br
NODE_ENV=production

# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_TOKEN=OBTER_NO_ZERO_TRUST_DASHBOARD
```

- [ ] **Step 2: Confirmar que `.env.example` NÃO está no `.gitignore`**

O `.gitignore` atual tem `.env*` — isso exclui `.env.example` também. Adicionar exceção:

```bash
# Abrir .gitignore e adicionar logo após a linha .env*:
# !.env.example
```

O trecho final da seção `env files` deve ficar assim:

```
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

- [ ] **Step 3: Verificar que `.env.example` aparece no git status**

```bash
git status
```

Esperado: `.env.example` listado como `Untracked files` (não ignorado).

- [ ] **Step 4: Commit e push**

```bash
git add .env.example .gitignore
git commit -m "chore: add .env.example template and unignore it"
git push origin master
```

Esperado: push bem-sucedido para `github.com/michelpreto/stocky`.

---

## Task 6: Preparar servidor Zima OS (manual — SSH)

> Esta task é executada manualmente via SSH no servidor Zima OS.
> Substituir `<IP_DO_SERVIDOR>` pelo IP exibido no painel do Zima OS.

- [ ] **Step 1: Conectar ao servidor**

```bash
ssh casaos@<IP_DO_SERVIDOR>
# ou: ssh root@<IP_DO_SERVIDOR>
```

Se pedir senha, use a senha configurada na instalação do Zima OS.

- [ ] **Step 2: Instalar Git**

```bash
apt-get update && apt-get install -y git
git --version
```

Esperado: `git version 2.x.x`

- [ ] **Step 3: Verificar Docker Compose v2**

```bash
docker compose version
```

Se retornar erro ou versão v1 (`docker-compose`), instalar o plugin:

```bash
apt-get install -y docker-compose-plugin
docker compose version
```

Esperado: `Docker Compose version v2.x.x`

- [ ] **Step 4: Clonar o repositório**

```bash
git clone https://github.com/michelpreto/stocky ~/stocky
cd ~/stocky
```

Esperado: diretório `~/stocky` criado com todos os arquivos do repositório.

---

## Task 7: Configurar Cloudflare Tunnel (manual — painel web)

> Esta task é feita no painel web do Cloudflare. Não requer SSH.

- [ ] **Step 1: Acessar o Cloudflare Zero Trust**

Abrir `https://one.dash.cloudflare.com` → selecionar conta → **Networks** → **Tunnels**

- [ ] **Step 2: Criar o túnel**

Clicar em **Create a tunnel** → escolher **Cloudflared** → Next

Nome do túnel: `almoxcontrol-home` → **Save tunnel**

- [ ] **Step 3: Copiar o token**

Na tela seguinte, copiar o token exibido (começa com `eyJ...`). Guardar em lugar seguro — será usado no `.env` do servidor.

- [ ] **Step 4: Configurar o hostname público**

Na aba **Public Hostname** → **Add a public hostname**:

| Campo | Valor |
|-------|-------|
| Subdomain | `stocky` |
| Domain | `mpmserver.com.br` |
| Type | HTTP |
| URL | `app:3000` |

Clicar em **Save hostname**.

- [ ] **Step 5: Verificar DNS**

Em **Websites** → `mpmserver.com.br` → **DNS** → verificar que existe um registro `CNAME` criado automaticamente:

```
stocky.mpmserver.com.br → <uuid>.cfargotunnel.com
```

(O Cloudflare cria esse registro automaticamente ao salvar o hostname.)

---

## Task 8: Criar `.env` no servidor (manual — SSH)

> De volta ao SSH no servidor.

- [ ] **Step 1: Gerar senhas seguras**

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
```

Copiar os dois valores gerados.

- [ ] **Step 2: Criar o arquivo `.env`**

```bash
cd ~/stocky
nano .env
```

Preencher com os valores reais (substituindo os placeholders):

```env
POSTGRES_USER=almox
POSTGRES_PASSWORD=<valor gerado no Step 1>
POSTGRES_DB=almoxcontrol
DATABASE_URL=postgresql://almox:<mesmo valor de POSTGRES_PASSWORD>@postgres:5432/almoxcontrol

NEXTAUTH_SECRET=<valor gerado no Step 1>
NEXTAUTH_URL=https://stocky.mpmserver.com.br
NODE_ENV=production

CLOUDFLARE_TUNNEL_TOKEN=<token copiado na Task 7 Step 3>
```

Salvar: `Ctrl+O` → Enter → `Ctrl+X`

- [ ] **Step 3: Verificar que `.env` foi criado corretamente**

```bash
grep -c "=" .env
```

Esperado: `8` (8 linhas com `=`)

- [ ] **Step 4: Confirmar que `.env` não está no git**

```bash
git status
```

Esperado: `.env` **não** listado (está ignorado pelo `.gitignore`).

---

## Task 9: Subir os containers (manual — SSH)

> Executar após o módulo de banco de dados (Prisma) estar implementado e no repositório.

- [ ] **Step 1: Fazer pull para garantir versão mais recente**

```bash
cd ~/stocky
git pull origin master
```

- [ ] **Step 2: Build da imagem da aplicação**

```bash
docker compose build app
```

Pode demorar 3-5 min na primeira vez. Esperado: `Successfully built` sem erros.

- [ ] **Step 3: Subir todos os containers**

```bash
docker compose up -d
```

Esperado: três linhas `✔ Container ... Started`

- [ ] **Step 4: Verificar status**

```bash
docker compose ps
```

Esperado: todos os serviços com `Status: Up` ou `Up (healthy)`:

```
NAME                    STATUS
stocky-postgres-1       Up (healthy)
stocky-app-1            Up
stocky-cloudflared-1    Up
```

- [ ] **Step 5: Verificar logs do túnel**

```bash
docker compose logs cloudflared --tail=20
```

Esperado: linha `Registered tunnel connection` sem erros de autenticação.

- [ ] **Step 6: Verificar logs do app**

```bash
docker compose logs app --tail=30
```

Esperado: `Ready` ou similar, sem erros de conexão com banco.

---

## Task 10: Rodar migrações e verificar deploy (manual — SSH)

- [ ] **Step 1: Rodar as migrações do Prisma**

```bash
docker compose exec app npx prisma migrate deploy
```

Esperado: `All migrations have been successfully applied.`

- [ ] **Step 2: Verificar acesso ao banco**

```bash
docker compose exec postgres psql -U almox -d almoxcontrol -c "\dt"
```

Esperado: lista de tabelas criadas pelas migrations.

- [ ] **Step 3: Verificar acesso externo**

Abrir no navegador: `https://stocky.mpmserver.com.br`

Esperado: AlmoxControl carrega com HTTPS válido (cadeado verde).

- [ ] **Step 4: Verificar anti-patterns proibidos da spec**

```bash
# Confirmar que .env não está no repositório
git log --all --full-history -- .env
```

Esperado: nenhum commit retornado.

---

## Workflow de atualização (referência futura)

Sempre que houver mudança no código:

```bash
# No servidor, via SSH
cd ~/stocky
git pull origin master
docker compose build app
docker compose up -d app

# Se houver nova migration
docker compose exec app npx prisma migrate deploy
```
