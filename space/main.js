// =======================
// space main.js — responsive starfield, Earth/Moon, and auto-ship
// =======================
const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');

// allRoutes (master list) and moving ships
let allRoutes = [];
let ships = [];
// moonPoints stored as polar coords relative to moon: {a: angle, r: normalizedRadius}
let moonPoints = [];
let highlightedRoutes = {}; // map routeIndex -> timestamp when opened
let dpr = window.devicePixelRatio || 1;
let cssWidth = 800;
let cssHeight = 400;

// (modal/image popup removed) 

function resizeCanvas() {
	dpr = window.devicePixelRatio || 1;
	const parent = canvas.parentElement;
	cssWidth = parent ? parent.clientWidth : window.innerWidth;
	const vw = window.innerWidth;
	const vh = window.innerHeight;

	// On small screens (mobile portrait), make the starfield a bit shorter
	if (vw <= 600) {
		cssHeight = Math.floor(vh * 0.6); // ~60% of viewport height
	} else {
		// fill available parent height if possible, else use a reasonable desktop height
		cssHeight = parent ? (parent.clientHeight || 400) : 400;
	}

	canvas.style.width = cssWidth + 'px';
	canvas.style.height = cssHeight + 'px';

	canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
	canvas.height = Math.max(1, Math.floor(cssHeight * dpr));

	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	// clear route/ship data on resize so positions recalc
	allRoutes = [];
	ships = [];
}

// ---------------- business state & UI ----------------
const state = {
	year: 2025,
	money: 50,           // simple units (displayed raw)
	robots: 0,
	routes: 1,          // how many active routes are running
	incomePerRoute: 12, // income per route per year
	baseCost: 8,        // base yearly cost
	nextRouteCost: 30,   // cost to open a new route
	strategy: 'conservative',
	history: [],
	investments: {} // e.g. { blue: 10, spacex: 20 }
};

// build progress (0..100)
state.buildProgress = 0;
// how many times player clicked "next year" (used to show events every N clicks)
state.nextYearClicks = 0;

// global build UI updater so it can be called from other places
function updateBuildUI() {
	const buildInner = document.getElementById('buildBarInner');
	const buildHint = document.getElementById('buildHint');
	if (buildInner) buildInner.style.width = Math.max(0, Math.min(100, state.buildProgress)) + '%';
	if (buildHint) buildHint.textContent = `进度：${Math.floor(state.buildProgress)}% — 点击填满以尝试开通航线（所需资金 ${formatMoney(state.nextRouteCost)})`;
}

function updateBottomPanel() {
	const y = document.getElementById('year');
	const m = document.getElementById('money');
	const r = document.getElementById('route-count');
	if (y) y.textContent = state.year;
	if (m) m.textContent = formatMoney(state.money);
	if (r) r.textContent = state.routes;

	// also update history & news displays (historyList will be updated elsewhere)
}

function addNews(text) {
	const newsList = document.getElementById('newsList');
	if (!newsList) return;
	const entry = document.createElement('div');
	entry.textContent = `${state.year}：${text}`;
	entry.style.padding = '6px 0';
	newsList.prepend(entry);
	// keep at most 6 news items
	while (newsList.children.length > 6) newsList.removeChild(newsList.lastChild);
}

function updateHistoryDisplay() {
	const hist = document.getElementById('historyList');
	if (!hist) return;
	hist.innerHTML = '';
	const recent = state.history.slice(-5);
	for (let i = recent.length - 1; i >= 0; i--) {
		const h = recent[i];
		const div = document.createElement('div');
		div.textContent = `${h.year}：${formatMoney(h.money)}（收入 ${formatMoney(h.income)} / 成本 ${formatMoney(h.cost)}）`;
		div.style.padding = '4px 0';
		hist.appendChild(div);
	}

	// draw small line chart in #historyChart if present
	const canvasHist = document.getElementById('historyChart');
	if (canvasHist && canvasHist.getContext) {
		const cw = canvasHist.clientWidth || canvasHist.width;
		const ch = canvasHist.clientHeight || canvasHist.height;
		canvasHist.width = Math.floor(cw * dpr);
		canvasHist.height = Math.floor(ch * dpr);
		const cctx = canvasHist.getContext('2d');
		cctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const data = state.history.slice(-5).map(x => x.money);
		if (data.length < 2) {
			cctx.clearRect(0, 0, cw, ch);
			return;
		}

		const pad = 8;
		const w = cw - pad * 2;
		const h = ch - pad * 2;
		const maxV = Math.max(...data);
		const minV = Math.min(...data);
		const range = Math.max(1e-6, maxV - minV);

		cctx.clearRect(0, 0, cw, ch);
		// background subtle
		cctx.fillStyle = 'rgba(0,0,0,0)';
		cctx.fillRect(0, 0, cw, ch);

		// draw polyline
		cctx.beginPath();
		data.forEach((v, i) => {
			const x = pad + (i / (data.length - 1)) * w;
			const y = pad + (1 - (v - minV) / range) * h;
			if (i === 0) cctx.moveTo(x, y); else cctx.lineTo(x, y);
		});
		cctx.strokeStyle = 'rgba(80,200,255,0.95)';
		cctx.lineWidth = 2;
		cctx.stroke();

		// draw dots
		cctx.fillStyle = 'rgba(200,240,255,0.95)';
		data.forEach((v, i) => {
			const x = pad + (i / (data.length - 1)) * w;
			const y = pad + (1 - (v - minV) / range) * h;
			cctx.beginPath();
			cctx.arc(x, y, 2.2, 0, Math.PI * 2);
			cctx.fill();
		});
	}
}

function formatMoney(val) {
	// show one decimal and append 单位 '亿'
	const v = Math.round(val * 10) / 10;
	return v.toLocaleString() + ' 亿';
}

// ---- moon point helpers (global) ----
function addMoonPoint() {
	const a = Math.random() * Math.PI * 2;
	const rNorm = Math.random() * 0.75; // fraction of moonR
	moonPoints.push({ a, r: rNorm });
}

function ensureInitialMoonPoints() {
	if (moonPoints.length > 0) return;
	const base = 5; // baseline bright points
	const desired = Math.min(60, base + state.routes); // +1 per active route
	for (let i = 0; i < desired; i++) addMoonPoint();
}

function settleOneYear() {
	// legacy: no persistent strategy; function now accepts optional modifiers
	// settleOneYear(modifiers) — modifiers may contain incomeMult, costMult, investThresholdMult, moneyDelta, techBoost
	const modifiers = arguments[0] || {};

	// base multipliers (no persistent strategy selected now)
	let incomeMult = 1 * (modifiers.incomeMult || 1);
	let costMult = 1 * (modifiers.costMult || 1);
	let investThresholdMult = (modifiers.investThresholdMult || 1);

	// apply immediate money delta if provided (player chooses an option that gives/uses cash immediately)
	if (modifiers.moneyDelta) state.money += modifiers.moneyDelta;

	// record investment if player chose to invest
	if (modifiers.investTag && modifiers.investAmount) {
		state.investments[modifiers.investTag] = (state.investments[modifiers.investTag] || 0) + modifiers.investAmount;
		addNews('已进行投资：' + (modifiers.investTag === 'blue' ? '参股蓝箭航空' : modifiers.investTag === 'spacex' ? '参股 SPACEX' : modifiers.investTag) );
	}

	// temporary tech boost multiplier for this year's incomePerRoute calculation
	const techBoost = modifiers.techBoost || 1;

	const income = state.routes * state.incomePerRoute * incomeMult * techBoost;
	const cost = state.baseCost * costMult;
	const profit = income - cost;

	state.money += profit;
	state.year += 1;

	// random events
	const eventRoll = Math.random();
	if (eventRoll < 0.06) {
		// bad event
		const loss = Math.min(state.money * 0.12, 0.5 * state.nextRouteCost);
		state.money -= loss;
		addNews('遭遇供应链中断，成本上升，损失 ' + formatMoney(loss));
	} else if (eventRoll > 0.94) {
		// good event
		const gain = Math.min(state.nextRouteCost * 0.4, Math.max(1, state.routes) * 2);
		state.money += gain;
		addNews('获得意外市场机会，收入增加 ' + formatMoney(gain));
	} else if (state.strategy === 'tech' && Math.random() < 0.12) {
		// tech success
		state.incomePerRoute *= 1.08;
		addNews('科技突破：单航线收入提升');
	}

	// process investments: each year investments may pay out (chance varies by target)
	for (const key of Object.keys(state.investments)) {
		const amt = state.investments[key];
		if (!amt) continue;
		if (key === 'blue') {
			// 蓝箭：中等概率小幅回报
			if (Math.random() < 0.18) {
				const gain = Math.round(amt * 1.6 * 10) / 10; // 1.6x payout
				state.money += gain;
				addNews('蓝箭股权获得回报：' + formatMoney(gain));
				delete state.investments[key];
			}
		} else if (key === 'spacex') {
			// SPACEX：较小概率大额回报
			if (Math.random() < 0.12) {
				const gain = Math.round(amt * 3.0 * 10) / 10; // 3x payout
				state.money += gain;
				addNews('SPACEX 投资获得大额回报：' + formatMoney(gain));
				delete state.investments[key];
			}
		}
	}

	// Opening new routes now requires the build progress bar to be full (player clicks to build).
	// Check and auto-complete only if buildProgress has reached 100.
	const threshold = state.nextRouteCost * investThresholdMult;
	if (state.buildProgress >= 100 && state.money > threshold && state.routes < allRoutes.length) {
		state.money -= state.nextRouteCost;
		state.routes += 1;
		state.buildProgress = 0; // reset progress after successful opening
		const newIndex = state.routes - 1;
		highlightedRoutes[newIndex] = Date.now();
		showNewRouteToast(`新航线已开通：第 ${state.routes} 条`);
		addMoonPoint();
			addNews('公司投资开通了第 ' + state.routes + ' 条航线');
			// show reward modal (photo + philosophical text)
			try { showRewardModal(); } catch (e) { console.error('reward modal error', e); }
	}

	// record history for this year
	state.history.push({ year: state.year, money: state.money, income, cost, profit });
	if (state.history.length > 50) state.history.shift();

	updateBottomPanel();
	updateHistoryDisplay();
}

// wire button if present
document.addEventListener('DOMContentLoaded', () => {
	const btn = document.getElementById('next-year');
	if (btn) btn.addEventListener('click', () => {
		// On next-year click also advance build progress (instead of clicking the bar)
		const baseInc = 12;
		const robotBonus = Math.floor(state.robots / 100000);
		const inc = baseInc + robotBonus;
		state.buildProgress = Math.min(100, state.buildProgress + inc);
		try { updateBuildUI(); } catch (e) {}
		// when progress reaches 100, show a reward modal (photo + philosophical text)
		if (state.buildProgress >= 100) {
			try { showRewardModal(); } catch (e) { console.error('reward modal error', e); }
		}
		// then settle the year (this will check buildProgress and open route if full)
		settleOneYear();
	});

	// build progress bar click handler
	const buildBar = document.getElementById('buildBar');
	const buildInner = document.getElementById('buildBarInner');
	const buildHint = document.getElementById('buildHint');
	// use global updateBuildUI()
	if (buildBar) {
		console.log('buildBar element present:', !!buildBar, 'buildInner:', !!buildInner);
		const doBuildClick = (ev) => {
			try {
				if (ev && ev.preventDefault) ev.preventDefault();
				console.log('buildBar clicked — before:', state.buildProgress);
				// increment per click; robots slightly speed up construction
				const baseInc = 12;
				const robotBonus = Math.floor(state.robots / 100000); // +1% per 100k robots
				const inc = baseInc + robotBonus;
				state.buildProgress = Math.min(100, state.buildProgress + inc);
				updateBuildUI();
				console.log('buildBar clicked — after:', state.buildProgress);
				if (state.buildProgress >= 100) {
					// try to open route immediately
					const threshold = state.nextRouteCost;
					if (state.routes >= allRoutes.length) {
						showNewRouteToast('当前没有可开通的航线');
						return;
					}
					if (state.money > threshold) {
						state.money -= state.nextRouteCost;
						state.routes += 1;
						state.buildProgress = 0;
						const newIndex = state.routes - 1;
						highlightedRoutes[newIndex] = Date.now();
						addMoonPoint();
						addNews('通过建设完成并开通了第 ' + state.routes + ' 条航线');
						showNewRouteToast(`新航线已开通：第 ${state.routes} 条`);
						// show reward modal (photo + philosophical text)
						try { showRewardModal(); } catch (e) { console.error('reward modal error', e); }
						updateBottomPanel();
						updateHistoryDisplay();
						updateBuildUI();
					} else {
						const lack = Math.max(0, (state.nextRouteCost - state.money));
						showNewRouteToast('资金不足，缺少 ' + formatMoney(lack));
					}
				}
			} catch (e) { console.error('build handler error', e); }
		};
		// disable direct clicks on the build bar — progress advances via "进入下一年" button
		try { buildBar.style.pointerEvents = 'none'; buildBar.title = '通过 点击“进入下一年” 来推进建设'; } catch (e) {}
	} else {
		console.warn('buildBar not found on DOMContentLoaded');
	}

	// initialize build UI immediately so progress text/width are correct
	updateBuildUI();
	// initialize displays
	updateBottomPanel();
	updateHistoryDisplay();
	// prompt player to choose starting package
	showStartModal();
});

// ---- yearly event generation & UI ----
function generateYearEvent() {
	// If it's the first decision (initial year), present company investment choices
	if (state.year === 2025 && state.history.length <= 1) {
		return [
			{
				id: 'invest_blue',
				title: '参股蓝箭航空',
				desc: '参股上市公司蓝箭航空：一次性投资 -10 亿，未来有小概率获得分红或升值。',
				modifiers: { moneyDelta: -10, investTag: 'blue', investAmount: 10 }
			},
			{
				id: 'invest_spacex',
				title: '参股 SPACEX',
				desc: '参股新兴航天公司 SPACEX：一次性投资 -20 亿，高风险高回报。',
				modifiers: { moneyDelta: -20, investTag: 'spacex', investAmount: 20 }
			},
			{
				id: 'hold_cash',
				title: '保持现金',
				desc: '保持流动性，不进行大型投资，便于后续运营或突发机会。',
				modifiers: { moneyDelta: 0 }
			}
		];
	}

	// otherwise produce default three choices
	return [
		{
			id: 'safe-grant',
			title: '争取稳健补助',
			desc: '争取到政府或合作方的小额补助，轻微降低本年成本并获得一次性资金。',
			modifiers: { moneyDelta: 5, costMult: 0.96 }
		},
		{
			id: 'fast-expand',
			title: '快速扩张计划',
			desc: '投入扩张、带来更高收入但增加成本，并降低开新航线门槛。',
			modifiers: { moneyDelta: -8, incomeMult: 1.28, costMult: 1.18, investThresholdMult: 0.85 }
		},
		{
			id: 'r_and_d',
			title: '加大研发投入',
			desc: '投资研发，可能提升单航线收入（作用于本年）。',
			modifiers: { moneyDelta: -6, techBoost: 1.12 }
		}
	];
}

function openEventChoices() {
	const choices = generateYearEvent();
	const container = document.getElementById('eventChoices');
	if (!container) {
		// fallback: choose first and proceed
		settleOneYear(choices[0].modifiers);
		return;
	}
	container.innerHTML = '';
	const title = document.createElement('div');
	title.textContent = '年度决策：请选择一项行动';
	title.style.fontWeight = '700';
	title.style.marginBottom = '10px';
	container.appendChild(title);

	for (const opt of choices) {
		const wrap = document.createElement('div');
		wrap.style.marginBottom = '8px';
		const b = document.createElement('button');
		b.textContent = opt.title;
		b.title = opt.desc;
		Object.assign(b.style, { display: 'block', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#0b66a7', color: '#fff', textAlign: 'left' });
		const p = document.createElement('div');
		p.textContent = opt.desc;
		p.style.fontSize = '12px';
		p.style.opacity = '0.95';
		p.style.marginTop = '6px';
		wrap.appendChild(b);
		wrap.appendChild(p);
		container.appendChild(wrap);
		b.addEventListener('click', () => {
			container.style.display = 'none';
			settleOneYear(opt.modifiers);
		});
	}
	// cancel button
	const cancel = document.createElement('button');
	cancel.textContent = '放弃（按默认方式结算）';
	Object.assign(cancel.style, { marginTop: '6px', padding: '8px 10px', borderRadius: '6px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer', width: '100%' });
	cancel.addEventListener('click', () => {
		container.style.display = 'none';
		settleOneYear();
	});
	container.appendChild(cancel);
	container.style.display = 'block';
}
function showNewRouteToast(text) {
	const div = document.createElement('div');
	div.textContent = text;
	Object.assign(div.style, {
		position: 'fixed',
		right: '18px',
		bottom: '84px',
		background: 'rgba(30,30,40,0.95)',
		color: '#fff',
		padding: '8px 12px',
		borderRadius: '6px',
		boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
		opacity: '0',
		transform: 'translateY(10px) scale(0.98)',
		transition: 'opacity 260ms ease, transform 260ms ease',
		zIndex: 9999,
		fontSize: '13px'
	});
	document.body.appendChild(div);
	// force layout then show
	void div.offsetWidth;
	div.style.opacity = '1';
	div.style.transform = 'translateY(0px) scale(1)';
	// hide after 2.2s
	setTimeout(() => {
		div.style.opacity = '0';
		div.style.transform = 'translateY(-6px) scale(0.98)';
		setTimeout(() => { div.remove(); }, 300);
	}, 2200);
}

// reward modal logic: show a space photo and a short philosophical text
const rewards = [
	{ img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&fit=crop', text: '从地心仰望，世界的边界变得模糊；人在宇宙中是短暂的见证者，却也承载着无限的想象。' },
	{ img: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1600&fit=crop', text: '星辰无言，但它们的沉默教会我们谦卑：所有成就，都始于一步无声的坚持。' },
	{ img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&fit=crop', text: '当我们越过地平线，才明白归属并非地点，而是同行者与未竟的使命。' },
	{ img: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1600&fit=crop', text: '宇宙很大，心量决定你能到达的远方。' },
	{ img: 'https://images.unsplash.com/photo-1502209524168-acea9360292d?w=1600&fit=crop', text: '在无垠的黑暗里，光只是我们选择的方向。' },
	{ img: 'https://images.unsplash.com/photo-1435224654926-ecc9f7fa028c?w=1600&fit=crop', text: '每一次发射，既是技术的胜利，也是人类好奇心的延伸。' },
	{ img: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1600&fit=crop', text: '遥远并非无法抵达，慢一点的步伐有时能看清更多星光。' },
	{ img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&fit=crop', text: '我们仰望星空，不是为了逃离，而是为了更好地理解脚下的土地。' },
	{ img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&fit=crop', text: '当世界沉睡，只有星光与志向继续前行。' }
];

function showRewardModal() {
	const modal = document.getElementById('rewardModal');
	const imgEl = document.getElementById('rewardImage');
	const textEl = document.getElementById('rewardText');
	const closeBtn = document.getElementById('rewardClose');
	const actionBtn = document.getElementById('rewardAction');
	if (!modal || !imgEl || !textEl) return;
	if (modal.classList && modal.classList.contains('active')) return; // already shown
	const r = rewards[Math.floor(Math.random() * rewards.length)];
	imgEl.src = r.img + '&auto=format&fit=crop&q=80';
	textEl.textContent = r.text;
	modal.classList.add('active');
	modal.setAttribute('aria-hidden', 'false');

	function hide() {
		modal.classList.remove('active');
		modal.setAttribute('aria-hidden', 'true');
		closeBtn.removeEventListener('click', hide);
		actionBtn.removeEventListener('click', hide);
		modal.removeEventListener('click', backdropHide);
	}

	function backdropHide(ev) { if (ev.target === modal) hide(); }

	closeBtn.addEventListener('click', hide);
	actionBtn.addEventListener('click', hide);
	modal.addEventListener('click', backdropHide);
}

function showStartModal() {
	const modal = document.getElementById('startModal');
	if (!modal) return;
	modal.style.display = 'flex';

	const profiles = {
		blue: {
			name: '蓝箭航天',
			desc: '蓝箭航天：聚焦中小型运载火箭与快速发射，适合稳健发展。',
			money: 10,
			robots: 10000
		},
		spacex: {
			name: 'SPACEX',
			desc: 'SPACEX：民营航天先锋，资金雄厚、追求快速扩张与复用技术。',
			money: 1000,
			robots: 1000000
		},
		sanhua: {
			name: '三花智控',
			desc: '三花智控：产业链与制造能力兼备，擅长在供应链与代工中获利。',
			money: 100,
			robots: 100000
		}
	};

	function choose(money, robots, cid) {
		state.money = money;
		state.robots = robots;
		state.companyId = cid;
		const profile = profiles[cid] || null;
		if (profile) {
			const titleEl = document.querySelector('.company-title');
			const subEl = document.querySelector('.company-subtitle');
			if (titleEl) titleEl.textContent = profile.name + '（本公司）';
			if (subEl) subEl.textContent = profile.desc;
			const stats = document.getElementById('companyStats');
			if (stats) stats.textContent = `初始资金：${formatMoney(state.money)}；机器人：${state.robots.toLocaleString()} 台`;
		}

		state.history = [];
		state.history.push({ year: state.year, money: state.money, routes: state.routes, note: '游戏开始' });
		updateBottomPanel();
		updateHistoryDisplay();
		// ensure build UI is initialized after player chooses starter
		try { updateBuildUI(); } catch (e) {}
		modal.style.display = 'none';
		showNewRouteToast(`已选择起始包：资金 ${formatMoney(state.money)}，机器人 ${state.robots}`);
	}

	const b1 = document.getElementById('start_blue');
	const b2 = document.getElementById('start_spacex');
	const b3 = document.getElementById('start_sanhua');
	if (b1) b1.onclick = () => choose(profiles.blue.money, profiles.blue.robots, 'blue');
	if (b2) b2.onclick = () => choose(profiles.spacex.money, profiles.spacex.robots, 'spacex');
	if (b3) b3.onclick = () => choose(profiles.sanhua.money, profiles.sanhua.robots, 'sanhua');
}


// Stars
const STAR_COUNT = 200;
const stars = [];

function initStars() {
	stars.length = 0;
	for (let i = 0; i < STAR_COUNT; i++) {
		const x = Math.random() * cssWidth;
		const y = Math.random() * cssHeight;
		const radius = Math.random() * 1.5 + 0.2;
		const speed = Math.random() * 0.25 + 0.05; // slow
		stars.push({ x, y, radius, speed });
	}
}

function updateStars() {
	for (const star of stars) {
		star.x += star.speed;
		if (star.x > cssWidth) {
			star.x = 0;
			star.y = Math.random() * cssHeight;
			star.radius = Math.random() * 1.5 + 0.2;
			star.speed = Math.random() * 0.25 + 0.05;
		}
	}
}

function drawStars() {
	ctx.fillStyle = '#000011';
	ctx.fillRect(0, 0, cssWidth, cssHeight);

	for (const star of stars) {
		ctx.beginPath();
		ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fillStyle = 'rgba(255,255,255,0.9)';
		ctx.fill();
	}
}

// Planets (images fallback to gradient)
const earthImg = new Image();
earthImg.src = 'diqiu.jpg';
let earthImgLoaded = false;
earthImg.onload = () => { earthImgLoaded = true; };

const moonImg = new Image();
moonImg.src = 'yueqiu.jpg';
let moonImgLoaded = false;
moonImg.onload = () => { moonImgLoaded = true; };

function drawPlanet(x, y, radius, mainColor, glowColor) {
	const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
	gradient.addColorStop(0, mainColor);
	gradient.addColorStop(1, glowColor);

	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.closePath();
	ctx.fillStyle = gradient;
	ctx.fill();
}

function drawEarthAndMoon() {
	const earthX = cssWidth * 0.2;
	const earthY = cssHeight * 0.6;
	const earthR = 120; // doubled previously, now 1.5x again -> 120
	if (earthImgLoaded) {
		ctx.drawImage(earthImg, earthX - earthR, earthY - earthR, earthR * 2, earthR * 2);
	} else {
		drawPlanet(earthX, earthY, earthR, '#3fa9f5', 'rgba(63,169,245,0.12)');
	}

	const moonX = cssWidth * 0.8;
	const moonY = cssHeight * 0.3;
	const moonR = 30; // 1.5x
	if (moonImgLoaded) {
		ctx.drawImage(moonImg, moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
	} else {
		drawPlanet(moonX, moonY, moonR, '#cccccc', 'rgba(255,255,255,0.06)');
	}

	ctx.setLineDash([5, 5]);
	ctx.strokeStyle = 'rgba(255,255,255,0.25)';
	ctx.beginPath();
	ctx.moveTo(earthX, earthY);
	ctx.lineTo(moonX, moonY);
	ctx.stroke();
	ctx.setLineDash([]);

	// ====== 地球上的 10 个节点（作为航线起点） ======
	const nodesInfo = [
		{ name: '武汉', angleDeg: -110 },
		{ name: '深圳', angleDeg: -70 },
		{ name: '曼谷', angleDeg: -30 },
		{ name: '休士顿', angleDeg: 20 },
		{ name: '图卢兹', angleDeg: 70 },
		// 另外 5 个城市节点
		{ name: '北京', angleDeg: -140 },
		{ name: '东京', angleDeg: -20 },
		{ name: '巴黎', angleDeg: 50 },
		{ name: '悉尼', angleDeg: 120 },
		{ name: '圣保罗', angleDeg: 160 }
	];

	const nodeR = earthR * 0.65;
	// Smaller, responsive font: scale with width but keep modest sizes
	const baseFont = 12;
	const fontScale = cssWidth / 1200; // larger width -> mild scale
	const fontSize = Math.max(9, Math.floor(baseFont * fontScale));
	ctx.font = fontSize + 'px sans-serif';
	ctx.fillStyle = 'rgba(255,255,255,0.95)';
	// define which cities are on the Earth's "front" (East Asia)
	const frontNames = new Set(['武汉', '深圳', '北京', '东京', '曼谷']);

	// initialize routes and ships once per resize
	if (allRoutes.length === 0) {
		// build route list from nodes
		for (const n of nodesInfo) {
			const rad = (n.angleDeg * Math.PI) / 180;
			const isFront = frontNames.has(n.name);
			const rPos = isFront ? nodeR : earthR;
			const nx = earthX + Math.cos(rad) * rPos;
			const ny = earthY + Math.sin(rad) * rPos;

			// create one or multiple routes per node (Wuhan has 3)
			const variations = (n.name === '武汉') ? [ -0.18, 0, 0.18 ] : [0];
			for (const v of variations) {
				const mx = (nx + moonX) / 2;
				const my = (ny + moonY) / 2;
				const dx = moonX - nx;
				const dy = moonY - ny;
				const dist = Math.hypot(dx, dy) || 1;
				let px = -dy / dist;
				let py = dx / dist;
				const sign = n.angleDeg >= 0 ? 1 : -1;
				const offset = dist * (0.12 + Math.abs(v));
				const cx = mx + px * offset * sign + v * dist;
				const cy = my + py * offset * sign;

				allRoutes.push({ start: { x: nx, y: ny }, cp: { x: cx, y: cy }, end: { x: moonX, y: moonY } });
			}
		}

		// create ships for each route
		for (let i = 0; i < allRoutes.length; i++) {
			ships.push({ routeIndex: i, t: Math.random() * 0.5, dir: 1, speed: Math.max(0.00002, (cssWidth / 1200) * 0.00003) });
		}

		// If we have fewer than desired total routes, add extra variations (keep same nodes)
		const TARGET_ROUTES = 20;
		if (allRoutes.length < TARGET_ROUTES) {
			const extraOffsets = [ -0.28, -0.18, -0.08, 0.08, 0.18, 0.28 ];
			let addIndex = 0;
			let nodeIdx = 0;
			while (allRoutes.length < TARGET_ROUTES) {
				const n = nodesInfo[nodeIdx % nodesInfo.length];
				const rad = (n.angleDeg * Math.PI) / 180;
				const isFront = frontNames.has(n.name);
				const rPos = isFront ? nodeR : earthR;
				const nx = earthX + Math.cos(rad) * rPos;
				const ny = earthY + Math.sin(rad) * rPos;

				const v = extraOffsets[addIndex % extraOffsets.length];
				const mx = (nx + moonX) / 2;
				const my = (ny + moonY) / 2;
				const dx = moonX - nx;
				const dy = moonY - ny;
				const dist = Math.hypot(dx, dy) || 1;
				let px = -dy / dist;
				let py = dx / dist;
				const sign = n.angleDeg >= 0 ? 1 : -1;
				const offset = dist * (0.12 + Math.abs(v));
				const cx = mx + px * offset * sign + v * dist;
				const cy = my + py * offset * sign;

				allRoutes.push({ start: { x: nx, y: ny }, cp: { x: cx, y: cy }, end: { x: moonX, y: moonY } });
				addIndex++;
				nodeIdx++;
			}

			// ensure ships array matches routes
			for (let i = ships.length; i < allRoutes.length; i++) {
				ships.push({ routeIndex: i, t: Math.random() * 0.5, dir: 1, speed: Math.max(0.00002, (cssWidth / 1200) * 0.00003) });
			}
		}
	}

	for (const n of nodesInfo) {
		const rad = (n.angleDeg * Math.PI) / 180;
		const isFront = frontNames.has(n.name);
		const rPos = isFront ? nodeR : earthR; // inside or on the edge
		const nx = earthX + Math.cos(rad) * rPos;
		const ny = earthY + Math.sin(rad) * rPos;

		// 节点点（稍小）
		ctx.beginPath();
		ctx.arc(nx, ny, 2, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fillStyle = 'rgba(255,255,255,0.95)';
		ctx.fill();

		// 标签位置: if on edge, push label slightly outward
		const labelOffset = isFront ? (fontSize > 10 ? 6 : 4) : (fontSize > 10 ? 10 : 8);
		const lx = nx + Math.cos(rad) * labelOffset;
		const ly = ny + Math.sin(rad) * labelOffset + (fontSize > 10 ? 4 : 3);
		ctx.fillStyle = 'rgba(255,255,255,0.92)';
		ctx.fillText(n.name, lx, ly);
		// (individual curved routes are drawn from routes list)
	}

	// ensure there are initial moon points (global helper)
	ensureInitialMoonPoints();
	// draw moon points (compute actual positions from polar coords)
	ctx.fillStyle = 'rgba(255,255,220,0.95)';
	for (const mp of moonPoints) {
		const px = moonX + Math.cos(mp.a) * (mp.r * moonR);
		const py = moonY + Math.sin(mp.a) * (mp.r * moonR);
		ctx.beginPath();
		ctx.arc(px, py, 1.5, 0, Math.PI * 2);
		ctx.fill();
	}

	// draw only the active routes (first state.routes entries)
	const now = Date.now();
	allRoutes.slice(0, state.routes).forEach((rt, idx) => {
		// compute base alpha and optionally pulse if recently opened
		let baseAlpha = 0.22;
		let lineW = 1;
		const startTs = highlightedRoutes[idx];
		if (startTs) {
			const elapsed = now - startTs;
			if (elapsed < 2000) {
				const t = elapsed / 2000;
				baseAlpha = 0.6 + 0.4 * Math.abs(Math.sin(t * Math.PI * 2));
				lineW = 1.4;
			} else {
				delete highlightedRoutes[idx];
			}
		}

		ctx.setLineDash([5, 4]);
		ctx.lineWidth = lineW;
		ctx.strokeStyle = `rgba(180,210,255,${baseAlpha})`;
		ctx.beginPath();
		ctx.moveTo(rt.start.x, rt.start.y);
		ctx.quadraticCurveTo(rt.cp.x, rt.cp.y, rt.end.x, rt.end.y);
		ctx.stroke();
		ctx.setLineDash([]);
	});

	return { earthX, earthY, moonX, moonY, earthR, moonR };
}

// Ship: automatic along Earth->Moon line (much slower than stars)
const ship = { t: 0, dir: 1, speed: 0.00006, x: 0, y: 0, angle: 0 };

function initShip() {
	ship.t = 0;
	ship.dir = 1;
	ship.speed = Math.max(0.00004, (cssWidth / 1200) * 0.00006);
}

function updateShip(earthX, earthY, moonX, moonY) {
	ship.t += ship.speed * ship.dir;
	if (ship.t >= 1) { ship.t = 1; ship.dir = -1; }
	if (ship.t <= 0) { ship.t = 0; ship.dir = 1; }

	ship.x = earthX + (moonX - earthX) * ship.t;
	ship.y = earthY + (moonY - earthY) * ship.t;

	const nextT = Math.max(0, Math.min(1, ship.t + 0.01 * ship.dir));
	const nx = earthX + (moonX - earthX) * nextT;
	const ny = earthY + (moonY - earthY) * nextT;
	ship.angle = Math.atan2(ny - ship.y, nx - ship.x);
}

function drawShip() {
	const size = 6; // smaller
	ctx.save();
	ctx.translate(ship.x, ship.y);
	ctx.rotate(ship.angle);

	ctx.beginPath();
	ctx.moveTo(size * 1.2, 0);
	ctx.lineTo(-size, size * 0.8);
	ctx.lineTo(-size, -size * 0.8);
	ctx.closePath();
	ctx.fillStyle = '#ffdd55';
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(-size - 1, 0);
	ctx.lineTo(-size - 6, 2);
	ctx.lineTo(-size - 6, -2);
	ctx.closePath();
	ctx.fillStyle = 'rgba(255,120,20,0.9)';
	ctx.fill();

	ctx.restore();
}

function animate() {
	updateStars();
	drawStars();
	const pos = drawEarthAndMoon();
	// update and draw ships moving along precomputed routes
	function quadPoint(p0, cp, p2, t) {
		const u = 1 - t;
		const x = u * u * p0.x + 2 * u * t * cp.x + t * t * p2.x;
		const y = u * u * p0.y + 2 * u * t * cp.y + t * t * p2.y;
		return { x, y };
	}
	function quadTangent(p0, cp, p2, t) {
		const u = 1 - t;
		const dx = 2 * u * (cp.x - p0.x) + 2 * t * (p2.x - cp.x);
		const dy = 2 * u * (cp.y - p0.y) + 2 * t * (p2.y - cp.y);
		return { dx, dy };
	}

	for (const sh of ships) {
		// only animate ships assigned to active routes
		if (sh.routeIndex >= state.routes) continue;
		const rt = allRoutes[sh.routeIndex];
		if (!rt) continue;

		sh.t += sh.speed * sh.dir;
		if (sh.t >= 1) { sh.t = 1; sh.dir = -1; }
		if (sh.t <= 0) { sh.t = 0; sh.dir = 1; }

		const p = quadPoint(rt.start, rt.cp, rt.end, sh.t);
		const tan = quadTangent(rt.start, rt.cp, rt.end, sh.t);
		const angle = Math.atan2(tan.dy, tan.dx);

		// draw ship as a small rotated triangle
		const size = 4;
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.rotate(angle);
		ctx.beginPath();
		ctx.moveTo(size, 0);
		ctx.lineTo(-size, size * 0.6);
		ctx.lineTo(-size, -size * 0.6);
		ctx.closePath();
		ctx.fillStyle = 'rgba(255,220,120,0.95)';
		ctx.fill();
		ctx.restore();
	}
	requestAnimationFrame(animate);
}

// startup
resizeCanvas();
initStars();
initShip();
// initial history entry
state.history.push({ year: state.year, money: state.money, income: 0, cost: 0, profit: 0 });
updateBottomPanel();
updateHistoryDisplay();
animate();

window.addEventListener('resize', () => {
	resizeCanvas();
	initStars();
	initShip();
});

