/* 공통 화면 틀(헤더 + 좌측 메뉴) 렌더링.
 * 페이지마다 nav 를 복붙하면 메뉴 추가할 때마다 9개 파일을 고쳐야 해서 한 군데로 뺐다.
 * 각 페이지는 <body data-page="..." data-title="..."> 만 세팅하면 된다.
 */
(function () {
  'use strict';

  // MESA-11 기능모델 기준으로 묶었다. (요구사항정의서 3장 참조)
  var MENU = [
    { grp: '현장 운영' },
    { id: 'dashboard', name: '생산 모니터링', ic: '▦', href: 'dashboard.html' },
    { id: 'workorder', name: '작업지시 관리', ic: '▤', href: 'workorder.html' },
    { id: 'dispatch',  name: '작업배정 · 디스패칭', ic: '▥', href: 'dispatch.html' },
    { id: 'pop',       name: 'POP 현장단말', ic: '▣', href: 'pop.html' },

    { grp: '설비 · 품질' },
    { id: 'equipment', name: '설비관리 · OEE', ic: '⚙', href: 'equipment.html' },
    { id: 'quality',   name: '품질관리 · SPC', ic: '◎', href: 'quality.html' },
    { id: 'batch',     name: '배치 · 레시피(S88)', ic: '⌬', href: 'batch.html' },

    { grp: '추적 · 분석' },
    { id: 'trace',     name: 'LOT 추적 · 계보', ic: '⌘', href: 'trace.html' },
    { id: 'analysis',  name: '성과분석 리포트', ic: '◪', href: 'analysis.html' }
  ];

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /** 08:00~20:00 주간(A), 그 외 야간(B). 현장 교대기준과 동일. */
  function shiftOf(d) {
    var h = d.getHours();
    return (h >= 8 && h < 20) ? 'A조(주간)' : 'B조(야간)';
  }

  function startClock(node) {
    function tick() {
      var d = new Date();
      node.textContent = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
        ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
    tick();
    setInterval(tick, 1000);
  }

  function build() {
    var user = Auth.guard();
    if (!user) return;

    var page = document.body.dataset.page || '';
    var title = document.body.dataset.title || '';
    var crumb = document.body.dataset.crumb || '';

    var layout = el('div', 'layout');

    // 좌상단 로고
    var brand = el('div', 'brand');
    brand.innerHTML = '<div class="mark"></div><div><b>SH-MES</b><span>제조실행시스템 v2.4</span></div>';

    // 상단바
    var top = el('header', 'topbar');
    top.appendChild(el('h1', null, title));
    if (crumb) top.appendChild(el('div', 'crumb', crumb));
    top.appendChild(el('div', 'spacer'));

    var shift = el('div', 'shift-tag', '화성1공장 · ' + shiftOf(new Date()));
    top.appendChild(shift);

    var clock = el('div', 'clock');
    startClock(clock);
    top.appendChild(clock);

    var who = el('div', 'who');
    who.innerHTML =
      '<div class="av">' + user.name.charAt(0) + '</div>' +
      '<div><div class="nm">' + user.name + ' ' + user.role + '</div>' +
      '<div class="dp">' + user.dept + '</div></div>';
    var out = el('button', null, '로그아웃');
    out.onclick = function () { Auth.logout(); };
    who.appendChild(out);
    top.appendChild(who);

    // 좌측 메뉴
    var nav = el('nav', 'side');
    MENU.forEach(function (m) {
      if (m.grp) { nav.appendChild(el('div', 'grp', m.grp)); return; }
      var a = el('a', m.id === page ? 'on' : '');
      a.href = m.href;
      a.innerHTML = '<span class="ic">' + m.ic + '</span><span>' + m.name + '</span>';
      nav.appendChild(a);
    });

    var main = el('main');
    // 기존 body 내용을 main 으로 옮긴다.
    while (document.body.firstChild) {
      main.appendChild(document.body.firstChild);
    }

    layout.appendChild(brand);
    layout.appendChild(top);
    layout.appendChild(nav);
    layout.appendChild(main);
    document.body.appendChild(layout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
