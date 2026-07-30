# MoneyFinance

MoneyFinance é um aplicativo financeiro completo (SaaS) criado para gerenciar as entradas, saídas e a porcentagem do caixa da sua empresa. Foi projetado com uma interface moderna e "premium", focando em regras de UI/UX, tema escuro e glassmorphism.

## Tecnologias Utilizadas
- **Backend:** Node.js, Express
- **Banco de Dados:** SQLite (`node:sqlite` nativo)
- **Frontend:** EJS, HTML5, CSS3 puro (sem frameworks), JavaScript
- **Autenticação:** express-session, bcrypt

## Como Instalar e Rodar Localmente

1. Certifique-se de ter o Node.js instalado na sua máquina (versão 22.5.0 ou superior recomendada, já que usa `node:sqlite`).
2. Clone ou acesse a pasta do projeto.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   *Ou em modo de produção:*
   ```bash
   npm start
   ```
5. Acesse no navegador: [http://localhost:3000](http://localhost:3000)

## Como Fazer o Deploy (Hospedagem Node.js)

Para colocar a aplicação online (ex: Render, Railway, DigitalOcean):
1. Crie um projeto na plataforma de sua escolha escolhendo o ambiente Node.js.
2. Defina as variáveis de ambiente necessárias (`PORT` e `SESSION_SECRET`).
3. Certifique-se de que a plataforma suporta persistência de disco para o banco SQLite (ou configure um volume montado), caso contrário, os dados serão perdidos a cada reinício do servidor (se for efêmero como no Heroku gratuito).
4. O comando de inicialização será `npm start`.

## Estrutura do Projeto
- `/database`: Configuração do banco de dados e migrações.
- `/middleware`: Interceptadores de rotas (ex: autenticação).
- `/routes`: Controladores e definições de rotas.
- `/public`: Arquivos estáticos (CSS, imagens).
- `/views`: Templates em EJS.
