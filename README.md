# SH-MES — 제조실행시스템

> **프로젝트SH** · 개인 프로젝트 · 남성흠
> 국내외 패키지와 국제표준을 조사해 "이런 공장이 있다면 시스템을 어떻게 설계할 것인가"를
> 끝까지 밀어붙여 본 기록이다. 등장하는 공장·라인·품목·수치는 설계를 구체화하기 위한 전제이고,
> 화면과 코드는 실제로 동작한다.

화성1공장(전자재료·정밀화학) 제조실행시스템. 작업지시부터 실적, 설비 가동, 품질, LOT 계보까지
한 흐름으로 잇는 것을 목표로 한 재구축 과제의 산출물이다.

배합(화학)과 조립이 한 공장에 섞여 있어, 일반적인 조립형 MES 구조만으로는 배합 라인을 못 담는다.
그래서 ISA-88 레시피 구조를 별도 화면으로 넣었다.

## 실행

빌드 과정 없다. 정적 파일이라 그냥 열면 된다.

```bash
python -m http.server 8080
```

브라우저에서 `http://localhost:8080` → 인트로 → 시스템 접속.

`file://` 로 직접 열어도 동작하지만, 브라우저에 따라 sessionStorage 정책이 달라 로그인이 안 풀릴 수 있다.
로컬 서버로 여는 쪽을 권장한다.

### 데모 계정

| 아이디 | 비밀번호 | 권한 |
|---|---|---|
| `test` | `test` | 생산관리자 (전 메뉴) |
| `op01` | `op01` | 현장작업자 |
| `qa01` | `qa01` | 품질담당 |

## 화면

| 번호 | 화면 | 경로 |
|---|---|---|
| M-01 | 생산 모니터링 | `app/dashboard.html` |
| M-02 | 작업지시 관리 | `app/workorder.html` |
| M-03 | 작업배정 · 디스패칭 | `app/dispatch.html` |
| M-04 | POP 현장단말 | `app/pop.html` |
| M-05 | 설비관리 · OEE | `app/equipment.html` |
| M-06 | 품질관리 · SPC | `app/quality.html` |
| M-07 | 배치 · 레시피 (ISA-88) | `app/batch.html` |
| M-08 | LOT 추적 · 계보 | `app/trace.html` |
| M-09 | 성과분석 리포트 | `app/analysis.html` |

## 구조

```
index.html              인트로(시스템 소개)
login.html              로그인
app/                    업무 화면 9종
assets/
  css/intro.css         인트로 전용
  css/app.css           앱 공통
  js/auth.js            세션/가드
  js/shell.js           헤더·좌측메뉴 공통 렌더
  js/chart.js           SVG 차트 (라인/막대/도넛/게이지/스파크)
  js/mock.js            시연 데이터셋
docs/                   사전조사 · 작업지시서 · 요구사항 · 화면설계 · 보고서
presentation/           발표자료
```

## 기술 선택에 대한 메모

**프레임워크를 안 쓴 이유** — 현장 패널PC가 폐쇄망이다. npm 의존성을 반입하려면 보안 심의를 거쳐야 하고,
그 심의가 2주 이상 걸린다. 화면 9개짜리 시스템에 그 비용을 치를 이유가 없었다.

**차트 라이브러리를 안 쓴 이유** — 같은 이유. 필요한 형태(라인·막대·도넛·게이지·관리도)만
`assets/js/chart.js` 에 직접 그렸다. 400줄 안 된다.

**데이터가 목업인 이유** — 이 저장소는 화면 설계 확정용이다. API 연동은 `mock.js` 의 각 함수를
`fetch('/api/v1/...')` 로 바꾸는 작업이며, 반환 형태를 인터페이스정의서와 동일하게 맞춰두었다.

## 표준 대응

- **MESA-11** 11대 기능 전부 대응 (매핑은 `docs/01_작업지시서.md` 2장)
- **ISA-95** Level 3 위치. 상위 SH-ERP(L4), 하위 SH-FMS(L2)
- **ISA-88** 마스터/컨트롤 레시피, 페이즈 실행, EBR
- **IATF 16949** 4M 변경점, 에러프루핑, 초물검사 연계

## 연관 시스템

- [SH-ERP](../sh-erp) — 전사적자원관리 (생산오더 송신, 실적 수신)
- [SH-FMS](../sh-monitoring) — 통합 모니터링 (설비 상태·알람 공유)

## 만든 사람

| | |
|---|---|
| 이름 | **남성흠** |
| 출생 | 1996년생 |
| 경력 | 중소기업 데이터센터 **7년 8개월차** (2026년 9월 기준) |
| GitHub | [gngnll19999-alt](https://github.com/gngnll19999-alt) |

### 프로젝트SH 3부작

- [Project-SH-MES](https://github.com/gngnll19999-alt/Project-SH-MES) — SH-MES 제조실행시스템 **(현재 저장소)**
- [Project-SH-ERP](https://github.com/gngnll19999-alt/Project-SH-ERP) — SH-ERP 전사적자원관리
- [Project-SH-FMS](https://github.com/gngnll19999-alt/Project-SH-FMS) — SH-FMS 자동화공장 통합 모니터링
