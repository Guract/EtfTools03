# EtfTools03

ETF 가격, 배당 이력, USD/KRW 환율을 바탕으로 보유 수량과 추가 매수 시뮬레이션을 계산하는 React/Vite 웹앱입니다.

## 주요 기능

- 해외/국내 ETF 프리셋 선택
- 직접 티커 입력 후 Yahoo Finance chart 데이터 자동 조회
- 최초 종가, 현재가, 경과 연수, CAGR 자동 계산
- 최근 배당 이력 기반 배당 주기 감지와 1회/연/월환산 배당 추정
- USD/KRW 환율 자동 조회와 5년 평균/현재/고점 시나리오 비교
- 배당 재투자/비재투자 결과 비교
- 연도별 결과 CSV 다운로드

## 로컬 실행

```bash
npm install
npm run dev
```

PowerShell 실행 정책 때문에 `npm`이 막히면 아래처럼 실행하면 됩니다.

```bash
npm.cmd run dev
```

## 인터넷 공개 배포: GitHub + Vercel

이 프로젝트는 정적 Vite 앱이지만 ETF 가격 조회를 위해 `/api/yahoo-chart` 프록시가 필요합니다. Vercel에서는 `api/yahoo-chart.js`가 서버리스 함수로 배포되어, 집 PC나 핸드폰에서도 같은 웹주소로 앱과 API가 함께 동작합니다.

1. GitHub에 새 저장소를 만듭니다.
2. 이 폴더에서 Git 저장소를 만들고 GitHub로 push합니다.
3. Vercel에서 `Add New... > Project`로 GitHub 저장소를 import합니다.
4. Framework Preset은 `Vite`로 두고, 설정은 아래 값을 사용합니다.

```text
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

5. 배포가 끝나면 Vercel이 제공하는 `https://프로젝트명.vercel.app` 주소로 접속합니다.

## 배포 전 확인

```bash
npm.cmd run build
```

빌드가 성공하면 Vercel에서도 같은 방식으로 빌드됩니다. 배포 후 아래 주소가 JSON을 반환하면 ETF 조회 API도 정상입니다.

```text
https://프로젝트명.vercel.app/api/yahoo-chart?ticker=QQQ&range=max&interval=1mo
```

## 데이터 주의

자동 조회값은 투자 조언이 아니라 시뮬레이션용 입력값입니다. 실제 투자 전에는 증권사, 운용사, 공식 공시 자료를 함께 확인해야 합니다.
