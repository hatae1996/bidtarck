// =============================================
// BidTrack - 입찰 분석 플랫폼 v1.0
// =============================================

// ── 데이터 저장소 ──────────────────────────────
const DB_KEY = 'bidtrack_data';

let db = {
  bids: [],
  competitors: [],
  nextId: 1
};

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) db = JSON.parse(raw);
  } catch(e) { console.warn('DB load error', e); }
}

function saveDB() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch(e) { showToast('저장 실패: 저장 공간 부족'); }
}



// ── 페이지 라우팅 ───────────────────────────────
let currentPage = 'dashboard';

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick')?.includes(`'${page}'`)) n.classList.add('active');
  });

  currentPage = page;
  renderPage(page);
}

function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  else if (page === 'bids') renderBids();
  else if (page === 'competitors') renderCompetitors();
  else if (page === 'analysis') renderAnalysis();
  else if (page === 'add') renderAddForm();
}

// ── 유틸리티 ────────────────────────────────────
function fmt(n) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억';
  if (n >= 10000) return (n / 10000).toFixed(0) + '만';
  return n.toLocaleString();
}

function fmtFull(n) {
  return n ? Number(n).toLocaleString() + '원' : '-';
}

function resultBadge(r) {
  if (r === 'win') return '<span class="badge win">낙찰</span>';
  if (r === 'lose') return '<span class="badge lose">탈락</span>';
  return '<span class="badge pending">진행중</span>';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return String(text).replace(re, '<mark class="highlight">$1</mark>');
}

// ── 대시보드 ─────────────────────────────────────
function renderDashboard() {
  const bids = db.bids;
  const wins = bids.filter(b => b.result === 'win');
  const loses = bids.filter(b => b.result === 'lose');
  const winRate = bids.length ? Math.round((wins.length / bids.length) * 100) : 0;
  const totalRevenue = wins.reduce((s, b) => s + Number(b.bidPrice || 0), 0);
  const avgPrice = bids.length ? Math.round(bids.reduce((s, b) => s + Number(b.bidPrice || 0), 0) / bids.length) : 0;

  const el = document.getElementById('page-dashboard');

  if (bids.length === 0) {
    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">대시보드</div>
        <div class="page-sub">입찰 현황 종합 요약</div>
      </div>
      <div class="page-content">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;">
          <div style="width:72px;height:72px;background:var(--blue-light);border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="4" y="4" width="28" height="28" rx="5" stroke="#4F7BF7" stroke-width="2"/>
              <line x1="10" y1="13" x2="26" y2="13" stroke="#4F7BF7" stroke-width="2" stroke-linecap="round"/>
              <line x1="10" y1="19" x2="20" y2="19" stroke="#4F7BF7" stroke-width="2" stroke-linecap="round"/>
              <line x1="10" y1="25" x2="23" y2="25" stroke="#4F7BF7" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div style="font-size:20px;font-weight:700;color:var(--gray-900);margin-bottom:10px;">아직 등록된 입찰 데이터가 없습니다</div>
          <div style="font-size:14px;color:var(--gray-400);line-height:1.8;margin-bottom:32px;">
            첫 번째 입찰 결과를 등록하면<br>대시보드에 통계와 차트가 자동으로 표시됩니다.
          </div>
          <button class="btn btn-primary" onclick="showPage('add')" style="padding:12px 28px;font-size:15px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            첫 입찰 등록하기
          </button>
        </div>
      </div>
    \`;
    return;
  }

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">대시보드</div>
      <div class="page-sub">입찰 현황 종합 요약</div>
    </div>
    <div class="page-content">
      <div class="stat-grid">
        <div class="stat-card blue">
          <div class="stat-label">총 입찰 건수</div>
          <div class="stat-value">${bids.length}<span class="stat-unit">건</span></div>
          <div class="stat-change neutral">전체 등록 데이터</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">낙찰 건수</div>
          <div class="stat-value">${wins.length}<span class="stat-unit">건</span></div>
          <div class="stat-change up">▲ 낙찰률 ${winRate}%</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">수주 총액</div>
          <div class="stat-value">${fmt(totalRevenue)}</div>
          <div class="stat-change neutral">낙찰 사업 합계</div>
        </div>
        <div class="stat-card red">
          <div class="stat-label">평균 입찰가</div>
          <div class="stat-value">${fmt(avgPrice)}</div>
          <div class="stat-change neutral">전체 사업 평균</div>
        </div>
      </div>

      <div class="chart-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">연도별 낙찰 현황</div>
          </div>
          <div class="card-body">
            <div class="chart-wrap"><canvas id="chart-yearly"></canvas></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">낙찰률 분석</div>
          </div>
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:24px;height:240px;">
              <canvas id="chart-winrate" width="180" height="180" style="flex-shrink:0;max-width:180px;max-height:180px;"></canvas>
              <div style="display:flex;flex-direction:column;gap:12px;">
                <div class="win-stat-item">
                  <div class="win-stat-dot" style="background:#22C55E"></div>
                  <span class="win-stat-label">낙찰</span>
                  <span class="win-stat-val">${wins.length}건 (${winRate}%)</span>
                </div>
                <div class="win-stat-item">
                  <div class="win-stat-dot" style="background:#EF4444"></div>
                  <span class="win-stat-label">탈락</span>
                  <span class="win-stat-val">${loses.length}건 (${100-winRate}%)</span>
                </div>
                <div style="margin-top:8px;padding-top:12px;border-top:1px solid var(--gray-100)">
                  <div style="font-size:12px;color:var(--gray-400);margin-bottom:4px;">최고 수주 금액</div>
                  <div style="font-size:16px;font-weight:700;color:var(--gray-900)">${fmtFull(wins.length ? Math.max(...wins.map(b=>b.bidPrice||0)) : 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card full">
          <div class="card-header">
            <div class="card-title">카테고리별 입찰 현황</div>
          </div>
          <div class="card-body">
            <div class="chart-wrap" style="height:200px;"><canvas id="chart-category"></canvas></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">최근 입찰 이력</div>
          <button class="btn btn-secondary btn-sm" onclick="showPage('bids')">전체 보기</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>사업명</th>
                <th>연도</th>
                <th>발주처</th>
                <th>입찰가</th>
                <th>결과</th>
              </tr>
            </thead>
            <tbody>
              ${[...bids].sort((a,b)=>b.year-a.year||b.month-a.month).slice(0,8).map(b => `
                <tr onclick="showBidDetail(${b.id})">
                  <td>${b.project}</td>
                  <td>${b.year}년 ${b.month}월</td>
                  <td>${b.client || '-'}</td>
                  <td style="font-weight:600;">${fmtFull(b.bidPrice)}</td>
                  <td>${resultBadge(b.result)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    drawYearlyChart();
    drawWinrateChart(winRate, wins.length, loses.length);
    drawCategoryChart();
  }, 50);
}

function drawYearlyChart() {
  const years = [...new Set(db.bids.map(b => b.year))].sort();
  const winData = years.map(y => db.bids.filter(b => b.year === y && b.result === 'win').length);
  const loseData = years.map(y => db.bids.filter(b => b.year === y && b.result === 'lose').length);
  const ctx = document.getElementById('chart-yearly');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years.map(y => y + '년'),
      datasets: [
        { label: '낙찰', data: winData, backgroundColor: '#22C55E', borderRadius: 4 },
        { label: '탈락', data: loseData, backgroundColor: '#FCA5A5', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Pretendard', size: 12 }, padding: 12 } } },
      scales: {
        x: { stacked: false, grid: { display: false }, ticks: { font: { family: 'Pretendard' } } },
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Pretendard' } }, grid: { color: '#F1F2F5' } }
      }
    }
  });
}

function drawWinrateChart(winRate, wins, loses) {
  const ctx = document.getElementById('chart-winrate');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [wins, loses],
        backgroundColor: ['#22C55E', '#FCA5A5'],
        borderWidth: 0,
        cutout: '72%'
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    },
    plugins: [{
      id: 'centerText',
      afterDraw(chart) {
        const ctx2 = chart.ctx;
        const cx = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
        const cy = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
        ctx2.save();
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.font = '700 26px Pretendard';
        ctx2.fillStyle = '#1F2937';
        ctx2.fillText(winRate + '%', cx, cy - 4);
        ctx2.font = '400 12px Pretendard';
        ctx2.fillStyle = '#9DA3B4';
        ctx2.fillText('낙찰률', cx, cy + 18);
        ctx2.restore();
      }
    }]
  });
}

function drawCategoryChart() {
  const cats = {};
  db.bids.forEach(b => {
    const c = b.category || '기타';
    if (!cats[c]) cats[c] = { total: 0, win: 0 };
    cats[c].total++;
    if (b.result === 'win') cats[c].win++;
  });
  const labels = Object.keys(cats);
  const ctx = document.getElementById('chart-category');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '낙찰', data: labels.map(l => cats[l].win), backgroundColor: '#4F7BF7', borderRadius: 4 },
        { label: '탈락', data: labels.map(l => cats[l].total - cats[l].win), backgroundColor: '#E4E6EC', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Pretendard', size: 12 }, padding: 12 } } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Pretendard' } } },
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Pretendard' } }, grid: { color: '#F1F2F5' } }
      }
    }
  });
}

// ── 입찰 목록 ─────────────────────────────────────
let bidSearch = '';
let bidFilterYear = '';
let bidFilterResult = '';
let bidFilterCat = '';

function renderBids() {
  const years = [...new Set(db.bids.map(b => b.year))].sort().reverse();
  const cats = [...new Set(db.bids.map(b => b.category).filter(Boolean))].sort();

  const el = document.getElementById('page-bids');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">입찰 목록</div>
      <div class="page-sub">전체 입찰 이력 조회 및 관리</div>
    </div>
    <div class="page-content">
      <div class="toolbar">
        <div class="search-box">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="10" x2="13.5" y2="13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input type="text" placeholder="사업명, 발주처 검색..." id="bid-search-input" value="${bidSearch}"
            oninput="bidSearch=this.value;renderBidsTable()">
        </div>
        <select class="filter-select" onchange="bidFilterYear=this.value;renderBidsTable()">
          <option value="">전체 연도</option>
          ${years.map(y => `<option value="${y}" ${bidFilterYear==y?'selected':''}>${y}년</option>`).join('')}
        </select>
        <select class="filter-select" onchange="bidFilterResult=this.value;renderBidsTable()">
          <option value="">전체 결과</option>
          <option value="win" ${bidFilterResult==='win'?'selected':''}>낙찰</option>
          <option value="lose" ${bidFilterResult==='lose'?'selected':''}>탈락</option>
          <option value="pending" ${bidFilterResult==='pending'?'selected':''}>진행중</option>
        </select>
        <select class="filter-select" onchange="bidFilterCat=this.value;renderBidsTable()">
          <option value="">전체 카테고리</option>
          ${cats.map(c => `<option value="${c}" ${bidFilterCat===c?'selected':''}>${c}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="showPage('add')" style="margin-left:auto">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          입찰 등록
        </button>
      </div>
      <div class="card">
        <div id="bids-table-body" class="table-wrap"></div>
      </div>
    </div>
  `;
  renderBidsTable();
}

function renderBidsTable() {
  let bids = [...db.bids];
  if (bidSearch) bids = bids.filter(b => b.project?.includes(bidSearch) || b.client?.includes(bidSearch));
  if (bidFilterYear) bids = bids.filter(b => String(b.year) === String(bidFilterYear));
  if (bidFilterResult) bids = bids.filter(b => b.result === bidFilterResult);
  if (bidFilterCat) bids = bids.filter(b => b.category === bidFilterCat);
  bids.sort((a, b) => b.year - a.year || b.month - a.month);

  const wrap = document.getElementById('bids-table-body');
  if (!wrap) return;

  if (bids.length === 0) {
    wrap.innerHTML = `<div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="8" y="8" width="24" height="24" rx="4" stroke="currentColor" stroke-width="2"/><line x1="13" y1="16" x2="27" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="21" x2="22" y2="21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <p>조건에 맞는 입찰 데이터가 없습니다</p>
      <div class="empty-sub">필터를 변경하거나 새 입찰을 등록하세요</div>
    </div>`;
    return;
  }

  wrap.innerHTML = `<table>
    <thead>
      <tr>
        <th>사업명</th>
        <th>연도</th>
        <th>발주처</th>
        <th>카테고리</th>
        <th>입찰가</th>
        <th>낙찰가(1위)</th>
        <th>결과</th>
        <th>비고</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${bids.map(b => {
        const winner = b.result === 'win' ? b : b.competitors?.find(c => c.rank === 1 || b.rank > 1);
        const winPrice = b.result === 'win' ? b.bidPrice : (b.competitors?.sort((a,b) => a.price - b.price)[0]?.price);
        return `<tr onclick="showBidDetail(${b.id})">
          <td style="font-weight:500;max-width:260px;">${highlight(b.project, bidSearch)}</td>
          <td style="white-space:nowrap">${b.year}년 ${b.month}월</td>
          <td>${highlight(b.client || '-', bidSearch)}</td>
          <td><span class="badge blue">${b.category || '-'}</span></td>
          <td style="font-weight:600;">${fmtFull(b.bidPrice)}</td>
          <td style="color:var(--gray-500)">${b.result === 'win' ? '<span style="color:var(--green)">▶ 당사</span>' : fmtFull(winPrice)}</td>
          <td>${resultBadge(b.result)}</td>
          <td style="color:var(--gray-400);font-size:12.5px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.note || ''}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();editBid(${b.id})" style="margin-right:4px">수정</button>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteBid(${b.id})">삭제</button>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

// ── 입찰 상세 모달 ─────────────────────────────────
function showBidDetail(id) {
  const b = db.bids.find(x => x.id === id);
  if (!b) return;
  const lowest = b.competitors?.length ? Math.min(...b.competitors.map(c => c.price || Infinity)) : null;

  document.getElementById('modal-title').textContent = b.project;
  document.getElementById('modal-body').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item">
        <div class="detail-item-label">입찰 결과</div>
        <div class="detail-item-value">${resultBadge(b.result)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">입찰 순위</div>
        <div class="detail-item-value">${b.rank ? b.rank + '위' : '-'}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">연도 / 월</div>
        <div class="detail-item-value">${b.year}년 ${b.month}월</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">발주처</div>
        <div class="detail-item-value">${b.client || '-'}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">카테고리</div>
        <div class="detail-item-value">${b.category || '-'}</div>
      </div>
      <div class="detail-item">
        <div class="detail-item-label">당사 입찰가</div>
        <div class="detail-item-value" style="font-size:16px;font-weight:700;color:var(--blue)">${fmtFull(b.bidPrice)}</div>
      </div>
    </div>
    ${b.competitors?.length ? `
      <div class="detail-section-title">경쟁사 입찰 현황</div>
      <table>
        <thead>
          <tr>
            <th>업체명</th>
            <th>입찰가</th>
            <th>vs 당사</th>
          </tr>
        </thead>
        <tbody>
          ${b.competitors.map(c => {
            const diff = ((c.price - b.bidPrice) / b.bidPrice * 100).toFixed(1);
            const sign = diff > 0 ? '+' : '';
            return `<tr>
              <td>${c.name}</td>
              <td style="font-weight:600">${fmtFull(c.price)}</td>
              <td style="color:${diff > 0 ? 'var(--green)' : 'var(--red)'}">${sign}${diff}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    ` : '<div style="color:var(--gray-400);font-size:13px;margin-top:16px;">경쟁사 데이터 없음</div>'}
    ${b.note ? `
      <div class="detail-section-title">비고</div>
      <p style="font-size:13.5px;color:var(--gray-600);line-height:1.7">${b.note}</p>
    ` : ''}
    <div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-secondary btn-sm" onclick="closeModal();editBid(${b.id})">수정</button>
      <button class="btn btn-danger btn-sm" onclick="closeModal();deleteBid(${b.id})">삭제</button>
    </div>
  `;

  openModal();
}

function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal').classList.add('open');
  setTimeout(() => document.getElementById('modal').classList.add('visible'), 10);
}

function closeModal() {
  document.getElementById('modal').classList.remove('visible');
  setTimeout(() => {
    document.getElementById('modal-overlay').classList.remove('open');
    document.getElementById('modal').classList.remove('open');
  }, 150);
}

// ── 경쟁사 분석 ─────────────────────────────────────
function renderCompetitors() {
  const stats = {};
  db.bids.forEach(b => {
    (b.competitors || []).forEach(c => {
      if (!stats[c.name]) stats[c.name] = { appearances: 0, totalPrice: 0, wins: 0, minPrice: Infinity, maxPrice: 0, projects: [] };
      stats[c.name].appearances++;
      stats[c.name].totalPrice += Number(c.price || 0);
      stats[c.name].projects.push({ project: b.project, price: c.price, ourPrice: b.bidPrice, result: b.result, year: b.year });
      if (c.price < stats[c.name].minPrice) stats[c.name].minPrice = c.price;
      if (c.price > stats[c.name].maxPrice) stats[c.name].maxPrice = c.price;
      if (b.result === 'lose') stats[c.name].wins++;
    });
  });

  const rows = Object.entries(stats).sort((a, b) => b[1].appearances - a[1].appearances);

  const el = document.getElementById('page-competitors');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">경쟁사 분석</div>
      <div class="page-sub">경쟁사 입찰 패턴 및 가격 전략 분석</div>
    </div>
    <div class="page-content">
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <div class="card-title">경쟁사별 입찰 현황</div>
        </div>
        <div class="card-body">
          <div class="chart-wrap"><canvas id="chart-comp"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">경쟁사 상세 분석</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>업체명</th>
                <th>경쟁 횟수</th>
                <th>평균 입찰가</th>
                <th>최저가</th>
                <th>최고가</th>
                <th>당사 대비 낙찰 횟수</th>
                <th>낙찰률(vs 당사)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(([name, s]) => {
                const avg = s.appearances ? Math.round(s.totalPrice / s.appearances) : 0;
                const winRate = s.appearances ? Math.round(s.wins / s.appearances * 100) : 0;
                return `<tr onclick="showCompetitorDetail('${encodeURIComponent(name)}')">
                  <td style="font-weight:600">${name}</td>
                  <td style="text-align:center">${s.appearances}회</td>
                  <td style="font-weight:500">${fmtFull(avg)}</td>
                  <td style="color:var(--green)">${fmtFull(s.minPrice === Infinity ? 0 : s.minPrice)}</td>
                  <td style="color:var(--red)">${fmtFull(s.maxPrice)}</td>
                  <td style="text-align:center">${s.wins}회</td>
                  <td>
                    <div class="comp-bar-wrap">
                      <div class="comp-bar">
                        <div class="comp-bar-fill ${winRate > 50 ? 'red' : winRate > 30 ? 'blue' : 'green'}" style="width:${winRate}%"></div>
                      </div>
                      <span style="font-size:12.5px;color:var(--gray-500)">${winRate}%</span>
                    </div>
                  </td>
                  <td><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showCompetitorDetail('${encodeURIComponent(name)}')">분석</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const labels = rows.map(r => r[0]);
    const counts = rows.map(r => r[1].appearances);
    const ctx = document.getElementById('chart-comp');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: '경쟁 참여 횟수', data: counts, backgroundColor: '#4F7BF7', borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Pretendard', size: 12 }, maxRotation: 30 } },
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Pretendard' } }, grid: { color: '#F1F2F5' } }
          }
        }
      });
    }
  }, 50);
}

function showCompetitorDetail(encodedName) {
  const name = decodeURIComponent(encodedName);
  const projects = [];
  db.bids.forEach(b => {
    (b.competitors || []).forEach(c => {
      if (c.name === name) projects.push({ project: b.project, price: c.price, ourPrice: b.bidPrice, result: b.result, year: b.year, month: b.month });
    });
  });
  projects.sort((a, b) => b.year - a.year || b.month - a.month);

  document.getElementById('modal-title').textContent = name + ' 상세';
  document.getElementById('modal-body').innerHTML = `
    <div class="detail-section-title">참여 사업 목록</div>
    <table>
      <thead>
        <tr><th>사업명</th><th>연도</th><th>경쟁사 입찰가</th><th>당사 입찰가</th><th>결과</th></tr>
      </thead>
      <tbody>
        ${projects.map(p => {
          const diff = ((p.price - p.ourPrice) / p.ourPrice * 100).toFixed(1);
          const cheaper = p.price < p.ourPrice;
          return `<tr>
            <td>${p.project}</td>
            <td>${p.year}년 ${p.month}월</td>
            <td style="color:${cheaper ? 'var(--red)' : 'var(--green)'};font-weight:600">${fmtFull(p.price)}</td>
            <td>${fmtFull(p.ourPrice)}</td>
            <td>${resultBadge(p.result)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  openModal();
}

// ── 통계 분석 ────────────────────────────────────
function renderAnalysis() {
  const el = document.getElementById('page-analysis');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">통계 분석</div>
      <div class="page-sub">입찰 데이터 심층 분석</div>
    </div>
    <div class="page-content">
      <div class="chart-grid">
        <div class="card">
          <div class="card-header"><div class="card-title">연도별 입찰 금액 추이 (억원)</div></div>
          <div class="card-body"><div class="chart-wrap"><canvas id="chart-trend"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">낙찰가 분포</div></div>
          <div class="card-body"><div class="chart-wrap"><canvas id="chart-dist"></canvas></div></div>
        </div>
        <div class="card full">
          <div class="card-header"><div class="card-title">발주처별 수주 현황</div></div>
          <div class="card-body"><div class="chart-wrap"><canvas id="chart-client"></canvas></div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">가격 경쟁력 분석</div></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
            ${getPriceStats()}
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    drawTrendChart();
    drawDistChart();
    drawClientChart();
  }, 50);
}

function getPriceStats() {
  const winBids = db.bids.filter(b => b.result === 'win' && b.bidPrice);
  const loseBids = db.bids.filter(b => b.result === 'lose' && b.bidPrice);
  const avgWin = winBids.length ? Math.round(winBids.reduce((s, b) => s + Number(b.bidPrice), 0) / winBids.length) : 0;
  const avgLose = loseBids.length ? Math.round(loseBids.reduce((s, b) => s + Number(b.bidPrice), 0) / loseBids.length) : 0;

  const allWithComp = db.bids.filter(b => b.competitors?.length && b.bidPrice);
  const avgPriceDiff = allWithComp.length ? allWithComp.reduce((s, b) => {
    const compAvg = b.competitors.reduce((cs, c) => cs + Number(c.price || 0), 0) / b.competitors.length;
    return s + ((b.bidPrice - compAvg) / compAvg * 100);
  }, 0) / allWithComp.length : 0;

  return `
    <div style="background:var(--green-light);border-radius:10px;padding:20px;text-align:center">
      <div style="font-size:12px;color:#16A34A;font-weight:600;margin-bottom:8px">낙찰 시 평균 입찰가</div>
      <div style="font-size:22px;font-weight:700;color:#15803D">${fmt(avgWin)}</div>
    </div>
    <div style="background:var(--red-light);border-radius:10px;padding:20px;text-align:center">
      <div style="font-size:12px;color:#DC2626;font-weight:600;margin-bottom:8px">탈락 시 평균 입찰가</div>
      <div style="font-size:22px;font-weight:700;color:#B91C1C">${fmt(avgLose)}</div>
    </div>
    <div style="background:var(--blue-light);border-radius:10px;padding:20px;text-align:center">
      <div style="font-size:12px;color:var(--blue);font-weight:600;margin-bottom:8px">경쟁사 대비 가격차 (평균)</div>
      <div style="font-size:22px;font-weight:700;color:var(--blue-dark)">${avgPriceDiff > 0 ? '+' : ''}${avgPriceDiff.toFixed(1)}%</div>
    </div>
  `;
}

function drawTrendChart() {
  const years = [...new Set(db.bids.map(b => b.year))].sort();
  const ctx = document.getElementById('chart-trend');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: years.map(y => y + '년'),
      datasets: [
        {
          label: '입찰 총액',
          data: years.map(y => {
            const s = db.bids.filter(b => b.year === y).reduce((s, b) => s + Number(b.bidPrice || 0), 0);
            return +(s / 100000000).toFixed(1);
          }),
          borderColor: '#4F7BF7', backgroundColor: 'rgba(79,123,247,0.08)',
          borderWidth: 2, tension: 0.3, fill: true, pointRadius: 5
        },
        {
          label: '수주 총액',
          data: years.map(y => {
            const s = db.bids.filter(b => b.year === y && b.result === 'win').reduce((s, b) => s + Number(b.bidPrice || 0), 0);
            return +(s / 100000000).toFixed(1);
          }),
          borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.08)',
          borderWidth: 2, tension: 0.3, fill: true, pointRadius: 5
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Pretendard', size: 12 }, padding: 12 } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Pretendard' } } },
        y: { beginAtZero: true, ticks: { font: { family: 'Pretendard' }, callback: v => v + '억' }, grid: { color: '#F1F2F5' } }
      }
    }
  });
}

function drawDistChart() {
  const ranges = [
    { label: '1억 미만', min: 0, max: 100000000 },
    { label: '1~2억', min: 100000000, max: 200000000 },
    { label: '2~3억', min: 200000000, max: 300000000 },
    { label: '3~5억', min: 300000000, max: 500000000 },
    { label: '5억 이상', min: 500000000, max: Infinity }
  ];
  const data = ranges.map(r => db.bids.filter(b => b.bidPrice >= r.min && b.bidPrice < r.max).length);
  const ctx = document.getElementById('chart-dist');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ranges.map(r => r.label),
      datasets: [{ data, backgroundColor: ['#93C5FD', '#60A5FA', '#4F7BF7', '#3560E0', '#1E40AF'], borderRadius: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Pretendard' } } },
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Pretendard' } }, grid: { color: '#F1F2F5' } }
      }
    }
  });
}

function drawClientChart() {
  const clients = {};
  db.bids.forEach(b => {
    const c = b.client || '미상';
    if (!clients[c]) clients[c] = { total: 0, win: 0 };
    clients[c].total++;
    if (b.result === 'win') clients[c].win++;
  });
  const sorted = Object.entries(clients).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  const ctx = document.getElementById('chart-client');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(e => e[0]),
      datasets: [
        { label: '낙찰', data: sorted.map(e => e[1].win), backgroundColor: '#4F7BF7', borderRadius: 4 },
        { label: '탈락', data: sorted.map(e => e[1].total - e[1].win), backgroundColor: '#E4E6EC', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Pretendard', size: 12 }, padding: 12 } } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Pretendard', size: 12 }, maxRotation: 30 } },
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Pretendard' } }, grid: { color: '#F1F2F5' } }
      }
    }
  });
}

// ── 입찰 등록/수정 ───────────────────────────────
let editingId = null;
let compCount = 1;

function renderAddForm(bid) {
  editingId = bid ? bid.id : null;
  const b = bid || {};
  compCount = bid?.competitors?.length || 1;

  const el = document.getElementById('page-add');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">${bid ? '입찰 수정' : '입찰 등록'}</div>
      <div class="page-sub">${bid ? '기존 입찰 정보를 수정합니다' : '새로운 입찰 결과를 등록합니다'}</div>
    </div>
    <div class="page-content">
      <form onsubmit="submitBid(event)">
        <div class="form-section">
          <div class="form-section-title">기본 정보</div>
          <div class="form-grid">
            <div class="form-group form-full">
              <label class="form-label">사업명 <span class="required">*</span></label>
              <input class="form-input" id="f-project" type="text" placeholder="예: 국가기록원 기록물 DB구축 용역" value="${b.project || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">발주처 <span class="required">*</span></label>
              <input class="form-input" id="f-client" type="text" placeholder="예: 국가기록원" value="${b.client || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">카테고리</label>
              <input class="form-input" id="f-category" type="text" placeholder="예: 기록물DB, 전자화, 관리시스템" value="${b.category || ''}"
                list="cat-list">
              <datalist id="cat-list">
                ${[...new Set(db.bids.map(x=>x.category).filter(Boolean))].map(c=>`<option value="${c}">`).join('')}
              </datalist>
            </div>
            <div class="form-group">
              <label class="form-label">입찰 연도 <span class="required">*</span></label>
              <input class="form-input" id="f-year" type="number" min="2000" max="2100" placeholder="예: 2024" value="${b.year || new Date().getFullYear()}" required>
            </div>
            <div class="form-group">
              <label class="form-label">입찰 월 <span class="required">*</span></label>
              <input class="form-input" id="f-month" type="number" min="1" max="12" placeholder="1~12" value="${b.month || ''}" required>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">입찰 결과</div>
          <div class="form-grid three">
            <div class="form-group">
              <label class="form-label">당사 입찰가 (원) <span class="required">*</span></label>
              <input class="form-input" id="f-bidPrice" type="number" min="0" step="1000" placeholder="예: 285000000" value="${b.bidPrice || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">낙찰 결과 <span class="required">*</span></label>
              <select class="form-input" id="f-result">
                <option value="win" ${b.result==='win'?'selected':''}>낙찰</option>
                <option value="lose" ${b.result==='lose'||!b.result?'selected':''}>탈락</option>
                <option value="pending" ${b.result==='pending'?'selected':''}>진행중</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">당사 순위</label>
              <input class="form-input" id="f-rank" type="number" min="1" placeholder="예: 2" value="${b.rank || ''}">
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center">
            경쟁사 정보
            <button type="button" class="btn btn-secondary btn-sm" onclick="addCompetitorRow()">+ 경쟁사 추가</button>
          </div>
          <div id="competitor-rows">
            ${(b.competitors?.length ? b.competitors : [{}]).map((c, i) => renderCompRow(i, c)).join('')}
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">추가 정보</div>
          <div class="form-group">
            <label class="form-label">비고 / 메모</label>
            <textarea class="form-input" id="f-note" placeholder="특이사항, 전략, 분석 내용 등">${b.note || ''}</textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="showPage('bids')">취소</button>
          <button type="submit" class="btn btn-primary">${bid ? '수정 저장' : '등록하기'}</button>
        </div>
      </form>
    </div>
  `;
}

function renderCompRow(i, c) {
  return `<div class="form-grid three" id="comp-row-${i}" style="margin-bottom:10px">
    <div class="form-group" style="grid-column:1/2">
      <label class="form-label">업체명</label>
      <input class="form-input" id="comp-name-${i}" type="text" placeholder="경쟁사 업체명" value="${c.name || ''}"
        list="comp-list-${i}">
      <datalist id="comp-list-${i}">
        ${[...new Set(db.bids.flatMap(b=>b.competitors||[]).map(c=>c.name).filter(Boolean))].map(n=>`<option value="${n}">`).join('')}
      </datalist>
    </div>
    <div class="form-group">
      <label class="form-label">입찰가 (원)</label>
      <input class="form-input" id="comp-price-${i}" type="number" min="0" step="1000" placeholder="예: 300000000" value="${c.price || ''}">
    </div>
    <div class="form-group" style="display:flex;align-items:flex-end">
      <button type="button" class="btn btn-danger btn-sm" onclick="removeCompRow(${i})" style="height:38px;width:100%">삭제</button>
    </div>
  </div>`;
}

function addCompetitorRow() {
  const wrap = document.getElementById('competitor-rows');
  const div = document.createElement('div');
  div.innerHTML = renderCompRow(compCount, {});
  wrap.appendChild(div.firstElementChild);
  compCount++;
}

function removeCompRow(i) {
  const row = document.getElementById(`comp-row-${i}`);
  if (row) row.remove();
}

function getCompetitors() {
  const comps = [];
  document.querySelectorAll('[id^="comp-name-"]').forEach(inp => {
    const i = inp.id.split('-').pop();
    const name = inp.value.trim();
    const price = document.getElementById(`comp-price-${i}`)?.value;
    if (name) comps.push({ name, price: Number(price) || 0 });
  });
  return comps;
}

function submitBid(e) {
  e.preventDefault();
  const bid = {
    project: document.getElementById('f-project').value.trim(),
    client: document.getElementById('f-client').value.trim(),
    category: document.getElementById('f-category').value.trim(),
    year: Number(document.getElementById('f-year').value),
    month: Number(document.getElementById('f-month').value),
    bidPrice: Number(document.getElementById('f-bidPrice').value),
    result: document.getElementById('f-result').value,
    rank: Number(document.getElementById('f-rank').value) || null,
    note: document.getElementById('f-note').value.trim(),
    competitors: getCompetitors(),
  };

  if (editingId) {
    const idx = db.bids.findIndex(b => b.id === editingId);
    if (idx > -1) { bid.id = editingId; bid.createdAt = db.bids[idx].createdAt; bid.updatedAt = new Date().toISOString(); db.bids[idx] = bid; }
  } else {
    bid.id = db.nextId++;
    bid.createdAt = new Date().toISOString();
    db.bids.push(bid);
  }

  saveDB();
  showToast(editingId ? '입찰 정보가 수정되었습니다' : '입찰이 등록되었습니다!');
  showPage('bids');
}

function editBid(id) {
  const b = db.bids.find(x => x.id === id);
  if (!b) return;
  showPage('add');
  renderAddForm(b);
}

function deleteBid(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  db.bids = db.bids.filter(b => b.id !== id);
  saveDB();
  showToast('삭제되었습니다');
  renderPage(currentPage);
}

// ── 사이드바 ────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── 초기화 ────────────────────────────────────
loadDB();
renderPage('dashboard');
