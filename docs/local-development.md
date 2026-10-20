# 💻 Guia de Desenvolvimento Local: Minha Gestação

Este manual orienta a execução do projeto no seu ambiente de desenvolvimento, seja direto na máquina (bare-metal) ou dentro do container Docker.

---

## 1. Pré-Requisitos

- **Node.js:** Versão 20.x ou superior (recomendado v20 LTS ou v24).
- **Gerenciador de Pacotes:** `npm` v10+ (ou `yarn`/`pnpm`).
- **Git** instalado.
- **Docker & Docker Compose** (opcional, caso queira rodar o app ou o Supabase em containers).
- **Aplicativo Expo Go:** Baixado no seu smartphone ou tablet (disponível na Google Play Store e Apple App Store) para testes em dispositivos reais.

---

## 2. Passo a Passo Inicial

### 2.1. Clonar o Repositório e Instalar Dependências
```bash
git clone <url-do-repositorio> minha-gestacao
cd minha-gestacao

npm install
```

### 2.2. Configurar Variáveis de Ambiente
Copie o modelo de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# URL e Anon Key do Supabase (Local ou Nuvem)
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...

# IP da sua máquina na rede local Wi-Fi (Necessário para testar no celular)
HOST_IP=192.168.1.100
```

> **Dica para descobrir seu IP local:**
> - No Linux/WSL: `hostname -I | awk '{print $1}'`
> - No macOS: `ipconfig getifaddr en0`
> - No Windows (PowerShell): `(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi*').IPAddress`

---

## 3. Modos de Execução

### 3.1. Execução no Navegador Web (Mais Rápida para Desenvolvimento)
O projeto conta com suporte completo a React Native Web e NativeWind:

```bash
npm run web
```
O Metro Bundler abrirá o aplicativo automaticamente em [http://localhost:8081](http://localhost:8081).
Você pode testar a responsividade da Doula (Tablet/Desktop) redimensionando a janela ou usando o modo responsivo do DevTools (F12).

### 3.2. Execução no Celular/Tablet com Expo Go (Via Rede Local)
Para visualizar o app no celular sem precisar compilar nativamente:

1. Certifique-se de que o computador e o smartphone estão conectados **na mesma rede Wi-Fi**.
2. Inicie o Metro em modo LAN:
```bash
npm start -- --lan
```
3. O terminal exibirá um **QR Code**:
   - **Android:** Abra o aplicativo **Expo Go**, toque em *"Scan QR Code"* e aponte a câmera para o terminal.
   - **iOS:** Abra a câmera nativa do iPhone/iPad e toque no banner do Expo que aparecer.

### 3.3. Execução no Emulador Android
Com o Android Studio e um AVD (Android Virtual Device) previamente configurado e aberto:

```bash
npm run android
```

---

## 4. Execução via Docker Compose

Se preferir manter o ambiente isolado em container sem poluir sua máquina:

### 4.1. Subir o Container
```bash
# Build e inicialização
docker compose up --build
```

O container subirá o Expo na porta `8081`. O volume local está mapeado, portanto qualquer alteração nos arquivos de código refletirá instantaneamente via Hot Reloading (Fast Refresh).

### 4.2. Parar o Container
```bash
docker compose down
```

---

## 5. Rotinas de Qualidade e Testes

Antes de abrir commits ou pull requests, execute as rotinas de integridade:

### 5.1. Rodar Testes Unitários (Jest)
Testa o motor obstétrico (`src/lib/obstetrics.ts`), regras de cálculo de DPP, idade gestacional e alertas obstétricos:

```bash
npm test
```

Para rodar em modo contínuo enquanto desenvolve:
```bash
npm run test:watch
```

### 5.2. Checagem de Tipagem TypeScript
```bash
npx tsc --noEmit
```

### 5.3. Testar Build Estático Web
Garante que não há importações quebradas ou incompatíveis com o Expo Router:
```bash
npx expo export --platform web
```

---

## 6. Solução de Problemas Comuns (Troubleshooting)

### O Expo Go no celular não consegue conectar ao Metro
1. Verifique se o firewall do computador não está bloqueando a porta `8081`.
2. Se estiver usando **WSL 2** no Windows: o IP do WSL é interno. Inicie o Expo passando o IP do Windows do adaptador Wi-Fi:
   ```bash
   REACT_NATIVE_PACKAGER_HOSTNAME=SEU_IP_WIFI npx expo start --lan
   ```
3. Alternativamente, use o modo túnel do Expo:
   ```bash
   npx expo start --tunnel
   ```

### Erro de cache do Metro Bundler
Se você renomear rotas do Expo Router ou alterar configurações do Tailwind e as mudanças não refletirem:
```bash
npx expo start -c
```
*(O parâmetro `-c` limpa o cache do Metro e reinicia o bundler)*.
