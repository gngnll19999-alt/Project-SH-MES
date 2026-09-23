/* 로그인 세션 처리
 * 데모 단계라 클라이언트에서만 검증한다. 운영 전환 시 POST /api/v1/auth/login 으로 교체할 것.
 * (요구사항 SH-MES-REQ-041 / 사내 SSO 연동은 2차 과제로 이월)
 */
(function (global) {
  'use strict';

  var KEY = 'shmes.session';

  // 데모 계정. 실제 계정은 인사DB(SH-ERP.HR_EMP) 연동으로 대체된다.
  var ACCOUNTS = [
    { id: 'test', pw: 'test', name: '남성흠', dept: '생산관리팀', role: '생산관리자', roleCode: 'PROD_MGR', plant: 'HS1' },
    { id: 'op01', pw: 'op01', name: '박성진', dept: '코팅1반',   role: '작업자',     roleCode: 'OPERATOR', plant: 'HS1' },
    { id: 'qa01', pw: 'qa01', name: '이지혜', dept: '품질보증팀', role: '품질담당',   roleCode: 'QA',       plant: 'HS1' }
  ];

  function login(id, pw) {
    var u = ACCOUNTS.filter(function (a) {
      return a.id === String(id || '').trim().toLowerCase() && a.pw === pw;
    })[0];
    if (!u) return null;

    var sess = {
      id: u.id, name: u.name, dept: u.dept, role: u.role,
      roleCode: u.roleCode, plant: u.plant,
      at: Date.now()
    };
    sessionStorage.setItem(KEY, JSON.stringify(sess));
    return sess;
  }

  function current() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function logout() {
    sessionStorage.removeItem(KEY);
    location.href = base() + 'login.html';
  }

  // app/ 하위에서 호출되는지 루트에서 호출되는지에 따라 경로가 달라진다.
  function base() {
    return location.pathname.indexOf('/app/') > -1 ? '../' : './';
  }

  /** 앱 화면 진입 가드. 세션 없으면 로그인으로 돌린다. */
  function guard() {
    var s = current();
    if (!s) {
      location.replace(base() + 'login.html?redirect=' + encodeURIComponent(location.pathname.split('/').pop()));
      return null;
    }
    return s;
  }

  global.Auth = { login: login, logout: logout, current: current, guard: guard, base: base, ACCOUNTS: ACCOUNTS };
})(window);
