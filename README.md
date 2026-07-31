# RoteiroJá — Frontend

Interface web do **RoteiroJá**, marketplace de passeios turísticos de Jaguariaíva-PR. Consome a API do repositório backend (repositório separado).

## O problema e a solução

As agências da cidade vendem pacotes que não se cruzam — o turista precisa pesquisar empresa por empresa. O RoteiroJá unifica o catálogo: o usuário monta um pacote com passeios de **diferentes agências em diferentes dias** e recebe um ticket por passeio para pagar direto com a agência. Detalhes completos no README do backend.

## Integrantes do grupo

- Murillo Costa

## Tecnologias

- **React 19** + **Vite 7** (JavaScript)
- **TanStack Router** — roteamento file-based (`src/routes/`)
- **TanStack Query** — dados do servidor (cache/invalidations)
- **Tailwind CSS 4** + componentes no padrão **shadcn/ui** (Radix)
- **react-hook-form** + **zod** — formulários com validação
- **sonner** — mensagens de sucesso/erro (toasts)
- Deploy: **Vercel**

## Estrutura

```
src/
  main.jsx              # entrada (QueryClient + Router + AuthProvider)
  routes/               # páginas (file-based routing)
    index.jsx           # catálogo com busca e filtro
    passeios.$tourId.jsx# detalhe do passeio + datas/vagas
    login.jsx           # tela de login
    cadastro.jsx        # tela de cadastro
    carrinho.jsx        # pacote em montagem + fechamento (tickets)
    minhas-viagens.jsx  # tickets e pacotes do usuário
    agencia.jsx         # painel da agência (CRUD passeios/saídas, tickets)
    admin.jsx           # painel admin (CRUD agências, acessos)
  components/           # Navbar + ui/ (button, card, dialog, ...)
  contexts/             # AuthContext (sessão via localStorage)
  services/             # api.js (fetch central) + serviços por domínio
  lib/                  # utilitários (cn, formatação de preço/data)
```

Toda informação exibida vem da API — **não há dados fixos**.

## Funcionalidades

- Cadastro e login com validação de formulários (zod) e feedback por toast
- Catálogo público com busca textual e filtro por dificuldade
- Detalhe do passeio: descrição, o que inclui, agência, datas com **vagas em tempo real** (esgotado = bloqueado)
- Carrinho/pacote: um passeio por dia, remoção de itens, total calculado, fechamento com emissão de tickets e link de WhatsApp da agência
- Minhas viagens: tickets com status colorido e cancelamento; histórico de pacotes
- Painel da agência: CRUD de passeios, gestão de datas/vagas, confirmação e utilização de tickets
- Painel admin: CRUD de agências e criação de acesso para agências
- Rotas protegidas por login e por perfil (cliente/agência/admin)
- Layout responsivo (mobile e desktop)

## Instalação e execução

```bash
git clone <URL_DESTE_REPO>
cd roteiroja-frontend
npm install
cp .env.example .env   # ajuste VITE_API_URL se necessário
npm run dev            # http://localhost:5173
```

O backend precisa estar rodando (ver README do repositório backend).

```bash
npm run build          # build de produção
npm run preview        # serve o build localmente
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API (ex.: `http://localhost:3000` ou a URL do deploy) |

## Links

- **Repositório backend:** https://github.com/muricoxt4/roteiroJaBackEnd
- **Deploy frontend (Vercel):** https://roteiroja-frontend.vercel.app
- **Deploy backend (Vercel):** https://roteiroja-backend-umber.vercel.app

## Credenciais de teste

Após o `npm run seed` no backend (senha de todos: `senha123`):

| Perfil | E-mail |
|---|---|
| ADMIN | `admin@roteiroja.com` |
| AGENCY | `agencia@camposfloridos.com` |
| CLIENT | `cliente@demo.com` |
