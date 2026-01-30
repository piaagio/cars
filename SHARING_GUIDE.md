# 특수차량 관리 시스템 공유 가이드

## 공유 방법

### 1. 로컬 네트워크 공유 (같은 WiFi 사용 시)

1. PC에서 간단한 웹 서버를 실행합니다:

   ```
   cd c:\Users\balla\Desktop\piaa\car
   python -m http.server 8000
   ```

   (Python이 설치되어 있어야 합니다)

2. PC의 IP 주소를 확인합니다:

   ```
   ipconfig
   ```

   IPv4 주소를 확인하세요 (예: 192.168.0.10)

3. 같은 WiFi에 연결된 모바일/태블릿에서 접속:

   ```
   http://192.168.0.10:8000/index.html
   ```

### 2. GitHub Pages를 통한 무료 호스팅 (권장)

1. GitHub 계정을 만듭니다 (github.com)
2. 새 저장소(Repository)를 생성합니다
3. `car` 폴더의 모든 파일을 업로드합니다
4. Settings > Pages에서 GitHub Pages를 활성화합니다
5. 생성된 URL을 공유합니다 (예: <https://username.github.io/car/>)

### 3. Vercel/Netlify를 통한 무료 호스팅

1. Vercel.com 또는 Netlify.com에 가입합니다
2. `car` 폴더를 드래그 앤 드롭으로 업로드합니다
3. 자동으로 생성된 URL을 공유합니다

### 4. 파일 직접 공유

- `car` 폴더를 압축하여 USB나 이메일로 전달
- 받는 사람은 압축을 풀고 `index.html`을 더블클릭하여 실행

## 추천 방법

**GitHub Pages**가 가장 안정적이고 무료이며, 언제 어디서나 접속 가능합니다.
