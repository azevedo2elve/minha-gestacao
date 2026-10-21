# 📚 Documentação do Projeto: Minha Gestação

Bem-vindo à documentação oficial do **Minha Gestação**, uma plataforma perinatal humanizada desenvolvida com **Expo SDK 52**, **NativeWind**, **Supabase** e **Spec-Driven Development (SDD)**.

---

## 🗂️ Estrutura da Documentação

Abaixo você encontra os manuais práticos e referências de arquitetura do sistema:

| Guia | Descrição |
|---|---|
| 🗄️ [**Guia do Supabase**](file:///home/azevedo/code/minha-gestacao/docs/supabase-guide.md) | Como configurar o Supabase local e em nuvem, aplicar migrations, executar o seed das 42 semanas, testar RLS e realizar inserts manuais/consultas. |
| 💻 [**Ambiente Local & Docker**](file:///home/azevedo/code/minha-gestacao/docs/local-development.md) | Passo a passo para rodar o app no computador (Web), via Docker Compose ou na rede Wi-Fi local para tablets e celulares. |
| 📱 [**Guia de Build para Android**](file:///home/azevedo/code/minha-gestacao/docs/android-build-guide.md) | Como executar no Emulador Android, no dispositivo físico via USB/Expo Go e como gerar builds com EAS (`.apk` e `.aab`). |
| 🩺 [**Motor de Cálculo Obstétrico**](file:///home/azevedo/code/minha-gestacao/docs/obstetric-engine.md) | Especificação das regras clínicas obstétricas (DUM vs Ultrassom, DPP, cálculo em UTC, trimestres e Red Flags). |
| 📋 [**Especificação Canônica (SPEC.md)**](file:///home/azevedo/code/minha-gestacao/SPEC.md) | Documento mestre de especificação técnica e funcional com o roadmap completo de features. |
| 🤖 [**Contexto para Agentes de IA (AGENT.md)**](file:///home/azevedo/code/minha-gestacao/AGENT.md) | Diretrizes e convenções para copilotos e agentes autônomos de IA que atuam no repositório. |

---

## 🚀 Início Rápido (TL;DR)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Rodar os testes automatizados
npm test

# 4. Iniciar o app no navegador
npm run web
```

Para mais detalhes sobre cada etapa, explore os guias específicos listados acima.
