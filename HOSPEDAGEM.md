# MoneyFinance - Hospedagem

## ⚠️ Importante: Sobre Netlify

O Netlify hospeda sites estáticos e funções serverless — ele **não suporta** servidores Node.js rodando continuamente (como Express) nem bancos de dados de arquivo como SQLite.

**Plataformas recomendadas para hospedar este app:**

| Plataforma | Plano Grátis | Link |
|---|---|---|
| **Railway** ✅ (Recomendado) | 5 USD de crédito/mês grátis | https://railway.app |
| **Render** ✅ | Gratuito (dorme após inatividade) | https://render.com |
| **Fly.io** ✅ | Plano gratuito disponível | https://fly.io |

---

## Deploy no Railway (mais simples)

### 1. Faça o push para o GitHub
```bash
git init
git add .
git commit -m "MoneyFinance v1"
git remote add origin https://github.com/SEU_USUARIO/moneyfinance.git
git push -u origin main
```

### 2. No Railway
1. Acesse https://railway.app e faça login com GitHub
2. Clique em **New Project** → **Deploy from GitHub Repo**
3. Selecione o repositório `moneyfinance`
4. O Railway vai detectar que é Node.js e fazer o deploy automaticamente

### 3. Variáveis de Ambiente no Railway
Vá em **Settings → Variables** e adicione:
```
SESSION_SECRET=coloque_uma_chave_secreta_aleatoria_aqui
NODE_ENV=production
```

### 4. Volume para o Banco de Dados (SQLite)
Para que os dados não se percam nos deploys:
1. Vá em **Settings → Volumes**
2. Adicione um Volume em `/app/database`
3. Ou altere o caminho do banco no código para `/data/moneyfinance.db`

---

## Deploy no Render

### 1. Faça o push para o GitHub (mesmo passo acima)

### 2. No Render
1. Acesse https://render.com e faça login
2. Clique em **New → Web Service**
3. Conecte seu repositório
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Adicione as variáveis:
   - `SESSION_SECRET` = sua chave secreta
   - `NODE_ENV` = production

---

## Arquivos já preparados

- `Procfile` — Para Railway/Render/Heroku
- `package.json` — Script `start` configurado
- `.env.example` — Referência de variáveis de ambiente

---

## Para rodar localmente

```bash
# Instalar dependências
npm install

# Iniciar o servidor
npm start

# Acesse: http://localhost:3000
```
