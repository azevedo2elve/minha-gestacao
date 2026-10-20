# 📱 Guia de Build & Execução Android: Minha Gestação

Este guia detalha o processo completo para rodar, compilar e gerar instaladores (`.apk` para testes internos e `.aab` para publicação na Google Play Store) no ecossistema Android usando **Expo SDK 52** e **EAS Build**.

---

## 1. Escolhendo a Estratégia de Execução no Android

Existem 3 formas de rodar o aplicativo no Android:

| Método | Quando Usar | Requisitos |
|---|---|---|
| **Expo Go** | Prototipagem rápida e testes de interface no dia a dia | Celular com app Expo Go (Sem compilação nativa) |
| **Local Android Build (`run:android`)** | Teste de módulos nativos avançados, áudio e câmera no computador | Android Studio, JDK 17 e Android SDK instalados |
| **EAS Build (Nuvem)** | Gerar arquivo `.apk` compartilhável ou `.aab` para a loja | Conta gratuita no Expo (Sem precisar configurar Android Studio) |

---

## 2. Método 1: Expo Go (Rápido e sem Configuração Nativa)

1. Instale o aplicativo **Expo Go** na Google Play Store do seu celular.
2. Inicie o servidor com:
   ```bash
   npx expo start --lan
   ```
3. Abra o app Expo Go no celular, toque em **Scan QR Code** e aponte para o código exibido no terminal.

---

## 3. Método 2: Build Nativo Local (`expo run:android`)

Esse método compila o projeto Android completo na sua máquina utilizando o Gradle.

### 3.1. Pré-Requisitos na Máquina Host
- **Java JDK 17:** Verifique com `java -version`.
- **Android Studio:**
  - Instale o **Android SDK** (API Level 34 ou 35).
  - Instale o **Android SDK Build-Tools** e **Android SDK Platform-Tools**.
- **Variáveis de Ambiente:** Adicione ao seu `~/.bashrc`, `~/.zshrc` ou variáveis do sistema Windows:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

### 3.2. Gerar a Pasta Nativa (`prebuild`)
O Expo gera a pasta nativa `android/` automaticamente a partir do `app.json`:

```bash
npx expo prebuild --platform android
```

### 3.3. Compilar e Instalar no Emulador ou Celular USB
Certifique-se de que o emulador está aberto ou que seu celular está conectado via USB com a **Depuração USB ativada** (verifique com `adb devices`).

Execute:
```bash
npx expo run:android
```
O Gradle baixará as dependências nativas do Android, compilará o APK de desenvolvimento e instalará no aparelho conectado.

---

## 4. Método 3: Gerando APK e AAB com EAS Build (Nuvem)

O **EAS (Expo Application Services)** compila seu aplicativo em servidores na nuvem sem exigir que você tenha o Android Studio instalado.

### 4.1. Instalar o EAS CLI e Fazer Login
```bash
npm install -g eas-cli
eas login
```

### 4.2. Configurar o Projeto no EAS
```bash
eas build:configure
```

Isso criará o arquivo `eas.json` na raiz do projeto. Configure-o com o perfil de **preview** (gera APK direto) e **production** (gera AAB para a loja):

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 4.3. Gerar APK para Instalação Direta no Celular (Perfil Preview)
Este comando compila um arquivo `.apk` que pode ser enviado via WhatsApp, Google Drive ou cabo para doulas e gestantes testarem:

```bash
eas build --platform android --profile preview
```
Ao final do build (leva cerca de 8 a 15 minutos), o EAS fornecerá um link com o botão de **Download do APK** e um QR Code para baixar direto no aparelho.

### 4.4. Gerar AAB para a Google Play Store (Perfil Production)
Para publicar oficialmente na Google Play Console:

```bash
eas build --platform android --profile production
```
O arquivo `.aab` (Android App Bundle) gerado pode ser enviado para a faixa de Teste Fechado ou Produção da Google Play.

---

## 5. Configurações Específicas do Android no `app.json`

O arquivo [`app.json`](file:///home/azevedo/code/minha-gestacao/app.json) já está preparado com os parâmetros essenciais:

```json
{
  "expo": {
    "name": "Minha Gestação",
    "slug": "minha-gestacao",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./assets/icon.png",
    "scheme": "minhagestacao",
    "userInterfaceStyle": "automatic",
    "android": {
      "package": "com.minhagestacao.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "backgroundColor": "#FAF6F0"
      },
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### Tráfego HTTP Local no Android (Cleartext)
Se você estiver testando com o Supabase rodando localmente (`http://192.168.x.x:54321`), o Android por padrão bloqueia conexões HTTP não-criptografadas.
Caso receba `Network request failed`:
1. Use conexão HTTPS configurando túnel ou o Supabase Cloud.
2. Ou adicione em `app.json` dentro do bloco `android`:
   ```json
   "android": {
     "usesCleartextTraffic": true
   }
   ```
