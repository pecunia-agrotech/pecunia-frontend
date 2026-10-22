# Pecunia AgroTech — Frontend

Interface web moderna, responsiva e de alta performance desenvolvida para o sistema **Pecunia AgroTech**, focada no gerenciamento financeiro, controle de custos e acompanhamento do diagnóstico zootécnico/econômico de propriedades de pecuária leiteira.

## 📋 Sumário

* [Visão Geral](#-visão-geral)

* [Principais Funcionalidades](#-principais-funcionalidades)

* [Tecnologias Utilizadas](#-tecnologias-utilizadas)

* [Arquitetura de Pastas](#-arquitetura-de-pastas)

* [Pré-requisitos](#-pré-requisitos)

* [Instalação e Execução](#-instalação-e-execução)

* [Scripts Disponíveis](#-scripts-disponíveis)

* [Integração com o Backend](#-integração-com-o-backend)

* [Testes e Qualidade](#-testes-e-qualidade)

* [Licença](#-licença)

## 🌾 Visão Geral

O frontend da aplicação Pecunia AgroTech atua como a camada de apresentação e interação do usuário final. A interface permite que produtores rurais e gestores zootécnicos realizem lançamentos financeiros diários, configurem parâmetros de custos fixos mensais, analisem a Demonstração do Resultado do Exercício (DRE), avaliem indicadores-chave (como **IOFC**, **Custo/Litro** e **Equilíbrio Estático**) e visualizem relatórios diagnósticos detalhados baseados em inteligência computacional.

Toda a lógica de negócios, cálculos de margens financeiras e motor de regras diagnósticas são executados no backend FastAPI, garantindo uma interface leve, previsível e sem duplicação de regras de negócio.

## ✨ Principais Funcionalidades

* 📊 **Dashboard Executivo:** Visualização da DRE mensal resumida, cartões de indicadores financeiros/zootécnicos e gráficos interativos de evolução diária e composição de custos.

* 📅 **Lançamentos e Extrato Diário:** Cadastro, edição e exclusão de receitas (ex: venda de leite) e despesas (ração, medicamentos, combustível), com formulário dinâmico validado.

* 🗓️ **Calendário Mensal:** Visão sintetizada do saldo e movimentação de cada dia do mês com atalho rápido para detalhamento.

* ⚙️ **Gestão de Custos Fixos:** Formulário para configuração dos custos de mão de obra, utilidades, manutenção, depreciação e dados de rebanho/ração.

* 💡 **Diagnóstico com Explicabilidade:** Exibição estruturada das regras diagnósticas ativadas, evidências encontradas, fatores de certeza (CF) e leitura do relatório gerencial formatado.

* 🔀 **Gestão de Cenários:** Alternância entre a base real da fazenda, base de demonstração e criação de cenários hipotéticos de simulação sem contaminar o histórico oficial.

* 📥 **Exportação de Dados:** Downloads diretos dos dados consolidados em formato `.csv` ou do relatório executivo em `.md`.

## 🛠️ Tecnologias Utilizadas

* **Framework Web:** [Next.js 16.4.2](https://nextjs.org/) (App Router)

* **Biblioteca de UI:** [React 19](https://react.dev/)

* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)

* **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com componentes [Radix UI](https://www.radix-ui.com/)

* **Ícones:** [Lucide React](https://lucide.dev/)

* **Visualização de Dados:** [Recharts](https://recharts.org/)

* **Formulários e Validação:** React Hook Form e [Zod](https://zod.dev/)

* **Renderização de Documentos:** React Markdown com plugins Remark/Rehype

* **Testes:** [Vitest](https://vitest.dev/), React Testing Library e [Playwright](https://playwright.dev/)

## 📁 Arquitetura de Pastas

```
pecunia-frotend/
├── src/
│   ├── app/                 # Configuração do Next.js App Router (Layouts e Páginas)
│   ├── components/          # Componentes visuais da interface (Dashboard, Form, Diagnosis, etc.)
│   │   └── ui/              # Componentes primitivos e acessíveis (Radix UI / Shadcn)
│   ├── core/
│   │   ├── services/        # Cliente HTTP centralizado e tratamento de API (api.ts)
│   │   ├── types/           # Tipos TypeScript e contratos OpenAPI gerados
│   │   └── use-cases/       # Contextos globais (FarmScope) e hooks reutilizáveis (useResource)
│   └── lib/                 # Utilitários de formatação (Moeda R$, Datas, Porcentagem)
├── tests/                   # Suítes de testes unitários, de componentes e E2E
├── public/                  # Ativos estáticos e imagens
├── package.json             # Dependências e scripts de execução
├── tsconfig.json            # Configurações do compilador TypeScript
└── tailwind.config.ts       # Configurações de tema e utilitários Tailwind CSS

```

## ⚙️ Pré-requisitos

Antes de iniciar, certifique-se de possuir instalado em sua máquina:

* **Node.js**: Versão `20.0.0` ou superior (testado na versão 24.x)

* **npm**: Versão `10.0.0` ou superior

* **Backend Pecunia AgroTech**: O backend FastAPI deve estar rodando em `http://localhost:8000` para pleno funcionamento da aplicação.

## 🚀 Instalação e Execução

1. **Clone o repositório**

2. **Instale as dependências do projeto:**

   ```
   npm install
   
   ```

3. **Inicie o servidor de desenvolvimento:**

   ```
   npm run dev
   
   ```

4. **Acesse no seu navegador:**
   Navegue até <http://localhost:3000> para visualizar a aplicação.

## 📜 Scripts Disponíveis

No diretório do projeto, você pode executar os seguintes comandos:

| Comando | Descrição | 
| ----- | ----- | 
| `npm run dev` | Executa o aplicativo em modo de desenvolvimento com Hot Reloading. | 
| `npm run build` | Compila o projeto otimizado para produção na pasta `.next`. | 
| `npm run start` | Inicia o servidor Node.js em modo de produção após o build. | 
| `npm test` | Roda as suítes de testes unitários e de componentes via Vitest. | 
| `npm run test:e2e` | Executa os testes End-to-End no navegador via Playwright. | 

## 🔗 Integração com o Backend

A comunicação é realizada via requisições HTTP REST contendo payload formatado em JSON.

* **Idempotência:** Ações de criação (`POST`) e alteração enviam um cabeçalho `Idempotency-Key` único para evitar duplicação em problemas de instabilidade de rede.

* **Bloqueio Otimista:** Atualizações de lançamentos e custos fixos enviam o atributo `version` para prevenção de sobramobilização ou concorrência simultânea (Retorno HTTP 409 em caso de conflito).

* **Tratamento de Origem:** As requisições respeitam as origens padrão configuradas no CORS do servidor FastAPI (`http://localhost:3000`).

## 🧪 Testes e Qualidade

O projeto conta com testes estruturados para garantir a usabilidade e estabilidade da interface:

```
# Executar testes unitários e de componente
npm test

# Executar verificação de cobertura
npx vitest run --coverage

```

Para garantir que novos campos de API não quebrem a interface, o script `contracts:check` garante a sincronicidade com os DTOs do backend.

## 📄 Licença

Este projeto é parte integrante do ecossistema de software do **Pecunia AgroTech**. Todos os direitos são reservados.