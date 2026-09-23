/* 시연용 데이터셋.
 * 운영 전환 시 각 함수를 fetch('/api/v1/...') 로 바꾸면 화면 코드는 그대로 둘 수 있게
 * 반환 형태를 실제 API 응답 스펙(인터페이스정의서 4장)과 동일하게 맞췄다.
 */
(function (global) {
  'use strict';

  var PLANT = { code: 'HS1', name: '화성1공장' };

  // 라인 마스터. 배합(화학) 2개 + 코팅 2개 + 조립 2개 + 검사/포장
  var LINES = [
    { code: 'MIX-01', name: '배합 1호기',  type: '배합', ct: 0,    cap: 1200 },
    { code: 'MIX-02', name: '배합 2호기',  type: '배합', ct: 0,    cap: 1200 },
    { code: 'CT-01',  name: '코팅 1라인',  type: '코팅', ct: 2.4,  cap: 9000 },
    { code: 'CT-02',  name: '코팅 2라인',  type: '코팅', ct: 2.6,  cap: 8300 },
    { code: 'AS-01',  name: '조립 1라인',  type: '조립', ct: 4.1,  cap: 5200 },
    { code: 'AS-02',  name: '조립 2라인',  type: '조립', ct: 4.0,  cap: 5400 },
    { code: 'INS-01', name: '검사 라인',   type: '검사', ct: 1.8,  cap: 12000 },
    { code: 'PK-01',  name: '포장 라인',   type: '포장', ct: 1.2,  cap: 18000 }
  ];

  var ITEMS = [
    { code: 'SH-EM220', name: '전극용 바인더 슬러리', unit: 'kg', spec: '고형분 42±2%' },
    { code: 'SH-CF100', name: '절연 코팅필름',        unit: 'EA', spec: 't0.12 / W1200' },
    { code: 'SH-AD330', name: '도전성 접착제',        unit: 'kg', spec: '점도 8500±500cP' },
    { code: 'SH-PM450', name: '방열 시트',            unit: 'EA', spec: 't0.5 / 열전도 6.2' },
    { code: 'SH-RS180', name: '이형 필름',            unit: 'EA', spec: 't0.05 / W1000' }
  ];

  var WORKERS = ['박성진', '최민호', '정다솜', '오승현', '한지원', '류경민', '서윤아'];

  // ---- 난수: 화면 새로고침마다 값이 널뛰면 시연할 때 설명이 꼬여서 시드 고정 ----
  var seed = 20260923;
  function rnd() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  function ri(a, b) { return Math.floor(a + rnd() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }

  function pad(n, w) { n = '' + n; while (n.length < (w || 2)) n = '0' + n; return n; }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function hhmm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // ---------------- 작업지시 ----------------
  var STATUS = ['계획', '확정', '투입', '진행', '완료', '마감'];

  var _wo = null;
  function workOrders() {
    if (_wo) return _wo;
    var list = [];
    var base = new Date();
    for (var i = 0; i < 26; i++) {
      var item = ITEMS[i % ITEMS.length];
      var line = LINES[i % LINES.length];
      var qty = ri(2, 40) * 100;
      var st = i < 3 ? '진행' : i < 6 ? '투입' : i < 11 ? '확정' : i < 16 ? '계획' : i < 22 ? '완료' : '마감';
      var done = st === '완료' || st === '마감' ? qty
        : st === '진행' ? Math.floor(qty * (0.2 + rnd() * 0.6))
        : st === '투입' ? Math.floor(qty * rnd() * 0.15) : 0;
      var bad = Math.floor(done * (0.002 + rnd() * 0.02));
      var d = new Date(base.getTime() + (i < 16 ? 0 : -1) * 86400000);

      list.push({
        no: 'WO-' + ymd(d).replace(/-/g, '').slice(2) + '-' + pad(i + 1, 3),
        erpOrder: 'PO-26' + pad(900 + i, 4),
        item: item.code,
        itemName: item.name,
        unit: item.unit,
        line: line.code,
        lineName: line.name,
        qty: qty,
        done: done,
        bad: bad,
        status: st,
        due: ymd(new Date(base.getTime() + ri(0, 6) * 86400000)),
        worker: pick(WORKERS),
        route: line.type === '배합' ? ['칭량', '투입', '교반', '검사', '충전']
             : line.type === '코팅' ? ['원단투입', '코팅', '건조', '권취', '검사']
             : ['부품투입', '조립', '체결', '검사', '포장'],
        lot: PLANT.code + '-' + line.code + '-' + ymd(d).replace(/-/g, '').slice(2) + '-' + pad(ri(1, 99), 3)
      });
    }
    _wo = list;
    return list;
  }

  // ---------------- 설비 상태 ----------------
  var DOWN_CODES = [
    { code: 'D01', name: '설비고장',       loss: '고장' },
    { code: 'D02', name: '금형/치공구 교체', loss: '작업준비·조정' },
    { code: 'D03', name: '품목 변경 셋업',  loss: '작업준비·조정' },
    { code: 'D04', name: '자재 대기',       loss: '고장' },
    { code: 'D05', name: '순간정지(잼)',    loss: '순간정지' },
    { code: 'D06', name: '속도 저하 운전',  loss: '속도저하' },
    { code: 'D07', name: '품질 이상 조치',  loss: '공정불량' },
    { code: 'D08', name: '초기 조건 맞춤',  loss: '초기수율' },
    { code: 'D09', name: '계획 보전',       loss: '계획정지' },
    { code: 'D10', name: '식사/휴게',       loss: '계획정지' },
    { code: 'D11', name: '작업자 부재',     loss: '고장' },
    { code: 'D12', name: '유틸리티 정전/단수', loss: '고장' }
  ];

  var _eq = null;
  function equipments() {
    if (_eq) return _eq;
    var sts = ['가동', '가동', '가동', '가동', '셋업', '대기', '정지', '가동'];
    _eq = LINES.map(function (l, i) {
      var a = 78 + rnd() * 20, p = 82 + rnd() * 16, q = 96 + rnd() * 3.6;
      var st = sts[i];
      if (st === '정지') { a = 41 + rnd() * 9; }
      return {
        code: l.code, name: l.name, type: l.type,
        status: st,
        item: st === '가동' || st === '셋업' ? ITEMS[i % ITEMS.length].code : '-',
        avail: +a.toFixed(1),
        perf: +p.toFixed(1),
        qual: +q.toFixed(1),
        oee: +(a * p * q / 10000).toFixed(1),
        mtbf: +(120 + rnd() * 180).toFixed(0),
        mttr: +(18 + rnd() * 40).toFixed(0),
        since: hhmm(new Date(Date.now() - ri(10, 320) * 60000)),
        downCode: st === '정지' ? pick(DOWN_CODES.slice(0, 4)) : null,
        nextPm: ymd(new Date(Date.now() + ri(-3, 25) * 86400000)),
        trend: Array.from({ length: 12 }, function () { return +(70 + rnd() * 25).toFixed(1); })
      };
    });
    return _eq;
  }

  // ---------------- 시간대별 생산량 ----------------
  function hourly() {
    var labels = [], plan = [], act = [];
    for (var h = 8; h <= 20; h++) {
      labels.push(pad(h) + ':00');
      var p = 1400;
      plan.push(p);
      // 12시 식사, 15시 셋업으로 실적이 꺼지는 구간을 일부러 넣었다 (시연 스토리)
      var f = h === 12 ? 0.42 : h === 15 ? 0.62 : 0.86 + rnd() * 0.22;
      act.push(Math.round(p * f));
    }
    return { labels: labels, plan: plan, act: act };
  }

  // ---------------- 불량 ----------------
  var DEFECTS = [
    { code: 'Q01', name: '표면 스크래치', cnt: 0 },
    { code: 'Q02', name: '두께 편차',     cnt: 0 },
    { code: 'Q03', name: '기포 혼입',     cnt: 0 },
    { code: 'Q04', name: '점도 이탈',     cnt: 0 },
    { code: 'Q05', name: '이물 혼입',     cnt: 0 },
    { code: 'Q06', name: '치수 불량',     cnt: 0 },
    { code: 'Q07', name: '외관 오염',     cnt: 0 },
    { code: 'Q08', name: '접착력 부족',   cnt: 0 }
  ];

  var _def = null;
  function defects() {
    if (_def) return _def;
    var v = [142, 96, 71, 55, 38, 27, 19, 11];
    _def = DEFECTS.map(function (d, i) { return { code: d.code, name: d.name, cnt: v[i] }; });
    return _def;
  }

  // ---------------- 이벤트 로그 ----------------
  var _ev = null;
  function events() {
    if (_ev) return _ev;
    var tpl = [
      { lv: 'bad',  t: '설비정지', m: 'CT-02 코팅 2라인 정지 — 자재 대기(D04)' },
      { lv: 'warn', t: '품질이상', m: 'SH-AD330 점도 측정값 9,140cP — 상한 초과' },
      { lv: 'info', t: '작업완료', m: 'WO-260922-018 완료 처리 (3,200 EA)' },
      { lv: 'warn', t: '자재부족', m: 'MIX-01 투입자재 BD-2200 잔량 18kg — 재고 확인 필요' },
      { lv: 'info', t: '셋업시작', m: 'AS-01 품목 변경 셋업 착수 (SH-PM450)' },
      { lv: 'bad',  t: '관리이탈', m: 'CT-01 두께 X-bar 관리상한 이탈 — 연속 2점' },
      { lv: 'info', t: '배치개시', m: 'BT-260923-004 컨트롤 레시피 실행 (MIX-02)' },
      { lv: 'warn', t: '보전도래', m: 'PK-01 예방보전 예정일 2일 경과' },
      { lv: 'info', t: '실적등록', m: 'INS-01 검사 실적 1,180 EA 등록 (정다솜)' },
      { lv: 'bad',  t: '설비정지', m: 'AS-02 순간정지 반복 5회 — 점검 요청' }
    ];
    var now = Date.now();
    _ev = tpl.map(function (e, i) {
      return { time: hhmm(new Date(now - (i * 7 + ri(1, 5)) * 60000)), lv: e.lv, type: e.t, msg: e.m };
    });
    return _ev;
  }

  // ---------------- SPC ----------------
  function spc(n) {
    n = n || 25;
    var target = 0.120, sd = 0.0028;   // 코팅 두께 t0.12mm
    var xbar = [], r = [];
    for (var i = 0; i < n; i++) {
      var drift = i > 18 ? (i - 18) * 0.00055 : 0;   // 후반부 공정 드리프트 (관리이탈 시연용)
      xbar.push(+(target + drift + (rnd() - 0.5) * sd * 2.2).toFixed(4));
      r.push(+(sd * (1.4 + rnd())).toFixed(4));
    }
    var mean = xbar.reduce(function (a, b) { return a + b; }, 0) / n;
    var rbar = r.reduce(function (a, b) { return a + b; }, 0) / n;
    var A2 = 0.577, D4 = 2.114, d2 = 2.326;   // n=5 기준 관리도 계수
    var sigma = rbar / d2;
    return {
      xbar: xbar, r: r,
      xUCL: +(mean + A2 * rbar).toFixed(4),
      xLCL: +(mean - A2 * rbar).toFixed(4),
      xCL: +mean.toFixed(4),
      rUCL: +(D4 * rbar).toFixed(4),
      rCL: +rbar.toFixed(4),
      usl: 0.128, lsl: 0.112,
      cp: +((0.128 - 0.112) / (6 * sigma)).toFixed(2),
      cpk: +Math.min((0.128 - mean) / (3 * sigma), (mean - 0.112) / (3 * sigma)).toFixed(2)
    };
  }

  // ---------------- ISA-88 배치 ----------------
  var PHASES = ['원료 칭량', '투입', '승온', '교반', '반응', '냉각', '배출'];

  function batches() {
    return [
      { no: 'BT-260923-004', recipe: 'RC-EM220-v4', item: 'SH-EM220', line: 'MIX-02',
        qty: 800, unit: 'kg', phase: '교반', phaseIdx: 3, start: '09:12', status: '진행',
        operator: '최민호', temp: 62.4, press: 1.08, rpm: 140 },
      { no: 'BT-260923-003', recipe: 'RC-AD330-v2', item: 'SH-AD330', line: 'MIX-01',
        qty: 500, unit: 'kg', phase: '냉각', phaseIdx: 5, start: '07:40', status: '진행',
        operator: '한지원', temp: 38.9, press: 1.01, rpm: 60 },
      { no: 'BT-260923-002', recipe: 'RC-EM220-v4', item: 'SH-EM220', line: 'MIX-02',
        qty: 800, unit: 'kg', phase: '배출', phaseIdx: 6, start: '05:05', status: '완료',
        operator: '최민호', temp: 25.1, press: 1.00, rpm: 0 },
      { no: 'BT-260922-011', recipe: 'RC-AD330-v2', item: 'SH-AD330', line: 'MIX-01',
        qty: 500, unit: 'kg', phase: '배출', phaseIdx: 6, start: '21:30', status: '완료',
        operator: '류경민', temp: 24.8, press: 1.00, rpm: 0 }
    ];
  }

  function recipes() {
    return [
      { code: 'RC-EM220-v4', name: '전극용 바인더 슬러리 표준', item: 'SH-EM220', ver: 'v4',
        approved: '2026-08-11', by: '이지혜', status: '승인', batchSize: 800, unit: 'kg',
        formula: [
          { mat: 'BD-2200', name: '바인더 수지',  qty: 336, unit: 'kg', tol: '±1.0%' },
          { mat: 'SV-0110', name: '용제(NMP)',    qty: 400, unit: 'kg', tol: '±0.5%' },
          { mat: 'CB-0450', name: '도전재',       qty: 48,  unit: 'kg', tol: '±2.0%' },
          { mat: 'AD-7701', name: '분산제',       qty: 16,  unit: 'kg', tol: '±2.0%' }
        ],
        steps: [
          { ph: '원료 칭량', set: '-',            time: 20 },
          { ph: '투입',      set: '-',            time: 15 },
          { ph: '승온',      set: '60 ~ 65 ℃',    time: 25 },
          { ph: '교반',      set: '140 rpm',      time: 90 },
          { ph: '반응',      set: '62 ℃ 유지',    time: 60 },
          { ph: '냉각',      set: '40 ℃ 이하',    time: 40 },
          { ph: '배출',      set: '-',            time: 25 }
        ]
      },
      { code: 'RC-AD330-v2', name: '도전성 접착제 표준', item: 'SH-AD330', ver: 'v2',
        approved: '2026-06-02', by: '이지혜', status: '승인', batchSize: 500, unit: 'kg',
        formula: [
          { mat: 'EP-1100', name: '에폭시 수지', qty: 275, unit: 'kg', tol: '±1.0%' },
          { mat: 'AG-0080', name: '은 분말',     qty: 175, unit: 'kg', tol: '±0.5%' },
          { mat: 'HD-3300', name: '경화제',      qty: 40,  unit: 'kg', tol: '±1.0%' },
          { mat: 'AD-7701', name: '분산제',      qty: 10,  unit: 'kg', tol: '±2.0%' }
        ],
        steps: [
          { ph: '원료 칭량', set: '-',         time: 15 },
          { ph: '투입',      set: '-',         time: 10 },
          { ph: '승온',      set: '45 ~ 50 ℃', time: 20 },
          { ph: '교반',      set: '60 rpm',    time: 120 },
          { ph: '반응',      set: '48 ℃ 유지', time: 45 },
          { ph: '냉각',      set: '30 ℃ 이하', time: 35 },
          { ph: '배출',      set: '-',         time: 20 }
        ]
      },
      { code: 'RC-EM220-v3', name: '전극용 바인더 슬러리 (구)', item: 'SH-EM220', ver: 'v3',
        approved: '2026-02-19', by: '이지혜', status: '폐기', batchSize: 800, unit: 'kg',
        formula: [], steps: [] }
    ];
  }

  // 배치 트렌드 (온도/압력/교반)
  function batchTrend() {
    var labels = [], temp = [], rpm = [], setT = [];
    for (var i = 0; i < 48; i++) {
      labels.push(pad(9 + Math.floor(i / 12)) + ':' + pad((i % 12) * 5));
      var t = i < 6 ? 25 + i * 6
            : i < 12 ? 61 + rnd() * 2
            : i < 30 ? 62 + (rnd() - 0.5) * 1.6
            : Math.max(38, 62 - (i - 30) * 1.4);
      temp.push(+t.toFixed(1));
      setT.push(i < 30 ? 62 : 40);
      rpm.push(i < 8 ? 0 : i < 34 ? 138 + ri(0, 5) : 60);
    }
    return { labels: labels, temp: temp, setT: setT, rpm: rpm };
  }

  // ---------------- LOT 계보 ----------------
  function genealogy(lot) {
    return {
      lot: lot || 'HS1-PK01-260923-041',
      item: 'SH-CF100', itemName: '절연 코팅필름',
      qty: 3200, unit: 'EA',
      made: '2026-09-23 06:20 ~ 11:48',
      shipTo: [
        { cust: '대성전자(주)', doc: 'DO-260923-007', qty: 2000, date: '2026-09-23' },
        { cust: '한빛소재(주)', doc: 'DO-260923-011', qty: 900,  date: '2026-09-23' }
      ],
      tree: {
        name: 'HS1-PK01-260923-041', proc: '포장', eq: 'PK-01', worker: '정다솜',
        at: '09-23 11:48', qty: '3,200 EA', ng: false,
        children: [
          {
            name: 'HS1-INS01-260923-037', proc: '검사', eq: 'INS-01', worker: '오승현',
            at: '09-23 10:55', qty: '3,240 EA', ng: false,
            children: [
              {
                name: 'HS1-CT01-260923-014', proc: '코팅', eq: 'CT-01', worker: '박성진',
                at: '09-23 08:30', qty: '3,300 EA', ng: true,
                children: [
                  { name: 'HS1-MIX02-260923-004', proc: '배합', eq: 'MIX-02', worker: '최민호',
                    at: '09-23 06:20', qty: '800 kg', ng: false, children: [
                      { name: 'BD-2200 / L26-0817', proc: '입고자재', eq: '-', worker: '금성케미칼',
                        at: '09-17 입고', qty: '336 kg', ng: false, children: [] },
                      { name: 'SV-0110 / L26-0902', proc: '입고자재', eq: '-', worker: '동방유화',
                        at: '09-02 입고', qty: '400 kg', ng: false, children: [] },
                      { name: 'CB-0450 / L26-0811', proc: '입고자재', eq: '-', worker: '태영카본',
                        at: '08-11 입고', qty: '48 kg', ng: false, children: [] }
                    ] },
                  { name: 'RS-0050 / L26-0828', proc: '입고자재', eq: '-', worker: '신일필름',
                    at: '08-28 입고', qty: '3,400 EA', ng: false, children: [] }
                ]
              }
            ]
          }
        ]
      }
    };
  }

  // ---------------- 디스패칭(간트) ----------------
  function schedule() {
    var rows = [];
    LINES.forEach(function (l, li) {
      var blocks = [];
      var cur = 8 * 60;   // 08:00 시작
      while (cur < 20 * 60) {
        var kind = rnd() < 0.18 ? 'setup' : 'run';
        var dur = kind === 'setup' ? ri(20, 45) : ri(70, 190);
        if (cur + dur > 20 * 60) dur = 20 * 60 - cur;
        blocks.push({
          kind: kind, start: cur, dur: dur,
          wo: kind === 'run' ? 'WO-2609' + pad(li * 4 + blocks.length + 1, 2) : '셋업',
          item: kind === 'run' ? ITEMS[(li + blocks.length) % ITEMS.length].code : ''
        });
        cur += dur + ri(0, 12);
      }
      var load = blocks.filter(function (b) { return b.kind === 'run'; })
                       .reduce(function (a, b) { return a + b.dur; }, 0) / (12 * 60) * 100;
      rows.push({ line: l.code, name: l.name, blocks: blocks, load: +load.toFixed(0) });
    });
    return rows;
  }

  global.Mock = {
    PLANT: PLANT, LINES: LINES, ITEMS: ITEMS, WORKERS: WORKERS,
    DOWN_CODES: DOWN_CODES, PHASES: PHASES,
    today: today, hhmm: hhmm,
    workOrders: workOrders, equipments: equipments, hourly: hourly,
    defects: defects, events: events, spc: spc,
    batches: batches, recipes: recipes, batchTrend: batchTrend,
    genealogy: genealogy, schedule: schedule
  };
})(window);
