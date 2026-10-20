# 📸 Evidências Visuais e Screenshots E2E (Playwright)

Este diretório armazena as evidências visuais de testes de ponta a ponta (E2E) realizados com o **Playwright** após a conclusão de cada feature do roadmap.

---

## 🗂️ Estrutura Obrigatória por Feature

Todos os prints e capturas de tela devem ser organizados em **subpastas exclusivas para cada feature**:

```text
docs/screenshots/
├── README.md                          # Este guia de organização
├── feature-01/                        # Autenticação, RBAC & Primeiro Acesso
│   ├── login-screen.png
│   ├── doula-dashboard.png
│   ├── change-password-screen.png
│   ├── pregnant-home.png
│   └── pregnant-profile.png
├── feature-02/                        # Doula Anamnesis Wizard & Provisionamento
│   ├── wizard-step-1.png
│   ├── wizard-step-2.png
│   ├── wizard-step-3.png
│   ├── wizard-step-4.png
│   ├── wizard-step-5.png
│   └── whatsapp-invite-modal.png
└── feature-XX/                        # Features subsequentes (03, 04, 05, etc.)
```

---

## 📐 Diretrizes de Nomenclatura e Salvamento

1. **Nunca salvar capturas na raiz:** Os arquivos de screenshot **nunca** devem ser deixados soltos na raiz do projeto (`/`) nem em diretórios temporários sem versionamento.
2. **Caminho absoluto ou relativo padronizado:**
   Ao utilizar o Playwright (MCP ou scripts), forneça sempre o caminho direto para a pasta da feature:
   ```json
   {
     "filename": "docs/screenshots/feature-XX/nome-descritivo.png",
     "scale": "css"
   }
   ```
3. **Padrão Kebab-Case:** Utilize nomes descritivos em minúsculas separados por hífen (ex: `doula-dashboard.png`, `red-flags-alert.png`, `diary-form.png`).
4. **Resolução Consistente:** Utilize `scale: "css"` para capturas leves e fiéis às dimensões de tela testadas (Mobile ou Tablet/Desktop).

---

## 📋 Índice de Evidências por Feature

| Feature | Pasta | Telas Capturadas |
|---|---|---|
| **Feature 01: Auth, RBAC & Primeiro Acesso** | [`feature-01/`](file:///home/azevedo/code/minha-gestacao/docs/screenshots/feature-01) | `login-screen.png`, `doula-dashboard.png`, `change-password-screen.png`, `pregnant-home.png`, `pregnant-profile.png` |
| **Feature 02: Anamnese & Provisionamento** | `feature-02/` | *(A ser gerado ao implementar Feature 02)* |
| **Feature 03: Dashboards Completos** | `feature-03/` | *(A ser gerado ao implementar Feature 03)* |
| **Feature 04: Diário & Red Flags** | `feature-04/` | *(A ser gerado ao implementar Feature 04)* |
| **Feature 05: Timeline & Peso** | `feature-05/` | *(A ser gerado ao implementar Feature 05)* |
| **Feature 06: Agenda & Videochamada** | `feature-06/` | *(A ser gerado ao implementar Feature 06)* |
| **Feature 07: Bate-Papo Realtime** | `feature-07/` | *(A ser gerado ao implementar Feature 07)* |
