(() => {
// Scoped game module to avoid polluting globals
const mapCanvas = document.getElementById("mapCanvas");
const miniCanvas = document.getElementById("miniCanvas");
const hoverTip = document.getElementById("hoverTip");

if (!mapCanvas) {
  return;
}

const moneyEl = document.getElementById("money");
const timeEl = document.getElementById("time");
const routesEl = document.getElementById("routes");
const utilEl = document.getElementById("util");
const incomeEl = document.getElementById("income");
const paxEl = document.getElementById("pax");
const cargoEl = document.getElementById("cargo");
const fleetTable = document.getElementById("fleetTable");
const revRoutesEl = document.getElementById("rev-routes");
const costOpsEl = document.getElementById("cost-ops");
const costFixedEl = document.getElementById("cost-fixed");
const netProfitEl = document.getElementById("net-profit");
const rewardModal = document.getElementById("rewardModal");
const rewardClose = document.getElementById("rewardClose");
const stageVisual = document.getElementById("stageVisual");
const rewardTitle = document.getElementById("rewardTitle");
const rewardTag = document.getElementById("rewardTag");
const rewardText = document.getElementById("rewardText");
const rewardAction = document.getElementById("rewardAction");

const btnRoute = document.getElementById("btn-route");
const btnShip = document.getElementById("btn-ship");
const btnUpgrade = document.getElementById("btn-upgrade");
const btnScan = document.getElementById("btn-scan");
const btnFinance = document.getElementById("btn-finance");
const btnNextMonth = document.getElementById("btn-next-month");

const mapCtx = mapCanvas.getContext("2d");
const miniCtx = miniCanvas ? miniCanvas.getContext("2d") : null;

let money = 1;
let year = 2026;
let month = 12;
let routes = 1;
let util = 74;
let income = 128_000;
let pax = 2250;
let cargo = 890;

const baseShip = {
  capacity: 20,
  tripsPerMonth: 1,
  ticketPrice: 0.05,
  variableCostPerPax: 0.02,
  fixedCost: 0.2,
  purchaseCost: 6
};

const baseInfrastructureCost = 2;
let shipCount = 1;

function renderRoutesList() {
  if (!fleetTable) return;
  fleetTable.innerHTML = "";
  if (routesData.length === 0) {
    const emptyRow = document.createElement("div");
    emptyRow.className = "fleet-row";
    emptyRow.innerHTML = "<div>暂无航线</div><div></div><div></div><div></div>";
    fleetTable.appendChild(emptyRow);
    return;
  }

  routesData.forEach(route => {
    const from = cities[route.from]?.name ?? "未知";
    const to = cities[route.to]?.name ?? "未知";
    const paxPerRoute = baseShip.capacity * baseShip.tripsPerMonth;
    const routeRevenue = paxPerRoute * baseShip.ticketPrice;
    const row = document.createElement("div");
    row.className = "fleet-row";
    row.innerHTML = `
      <div>航线: ${from} → ${to}</div>
      <div>状态: 开通</div>
      <div>载客: ${baseShip.capacity}</div>
      <div>客单价: ${baseShip.ticketPrice}亿（月收入 ${formatMoney(routeRevenue)})</div>
    `;
    fleetTable.appendChild(row);
  });
}

function showReward(message, title = "航线已开通", tag = "哲学") {
  if (!rewardModal || !rewardText) return;
  if (rewardTitle) rewardTitle.textContent = title;
  if (rewardTag) rewardTag.textContent = tag;
  rewardText.textContent = message;
  if (stageVisual) {
    stageVisual.setAttribute(
      "style",
      "background-image: url('https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1000&h=700&fit=crop'); background-size: cover; background-position: center center;"
    );
  }
  rewardModal.classList.add("active");
  rewardModal.setAttribute("aria-hidden", "false");
}

function closeReward() {
  if (!rewardModal) return;
  rewardModal.classList.remove("active");
  rewardModal.setAttribute("aria-hidden", "true");
}

if (rewardClose) {
  rewardClose.addEventListener("click", closeReward);
}

if (rewardAction) {
  rewardAction.addEventListener("click", closeReward);
}

if (rewardModal) {
  rewardModal.addEventListener("click", event => {
    if (event.target === rewardModal) closeReward();
  });
}

const cities = [
  { name: "曼谷", x: 0.45, y: 0.62 },
  { name: "武汉", x: 0.38, y: 0.47 },
  { name: "月港", x: 0.82, y: 0.28 },
  { name: "月城", x: 0.9, y: 0.42 }
];

const routesData = [
  { from: 0, to: 1, t: 0.75, speed: 0.00025 }
];

const wuhanIndex = cities.findIndex(city => city.name === "武汉");
const bangkokIndex = cities.findIndex(city => city.name === "曼谷");
const moonPortIndex = cities.findIndex(city => city.name === "月港");

function resizeCanvas() {
  const rect = mapCanvas.parentElement.getBoundingClientRect();
  mapCanvas.width = rect.width * devicePixelRatio;
  mapCanvas.height = rect.height * devicePixelRatio;
  mapCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  if (miniCanvas && miniCtx) {
    const miniRect = miniCanvas.getBoundingClientRect();
    miniCanvas.width = miniRect.width * devicePixelRatio;
    miniCanvas.height = miniRect.height * devicePixelRatio;
    miniCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawGrid(context, width, height) {
  context.strokeStyle = "rgba(143, 182, 255, 0.12)";
  context.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const x = (width / 10) * i;
    const y = (height / 10) * i;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function drawRoutes(context, width, height) {
  context.setLineDash([6, 6]);
  context.strokeStyle = "rgba(125, 227, 255, 0.7)";
  context.lineWidth = 2;
  routesData.forEach(route => {
    const start = cities[route.from];
    const end = cities[route.to];
    context.beginPath();
    context.moveTo(start.x * width, start.y * height);
    context.lineTo(end.x * width, end.y * height);
    context.stroke();
  });
  context.setLineDash([]);
}

function drawCities(context, width, height) {
  cities.forEach(city => {
    context.beginPath();
    context.arc(city.x * width, city.y * height, 4, 0, Math.PI * 2);
    context.fillStyle = "#7dff9f";
    context.fill();

    context.fillStyle = "rgba(231, 240, 255, 0.85)";
    context.font = "16px Courier New";
    context.fillText(city.name, city.x * width + 6, city.y * height - 6);
  });
}

function drawPlanes(context, width, height) {
  routesData.forEach(route => {
    const start = cities[route.from];
    const end = cities[route.to];
    route.t += route.speed;
    if (route.t > 1) route.t = 0;

    const x = start.x + (end.x - start.x) * route.t;
    const y = start.y + (end.y - start.y) * route.t;

    context.save();
    context.translate(x * width, y * height);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    context.rotate(angle);
    context.fillStyle = "#7de3ff";
    context.beginPath();
    context.moveTo(8, 0);
    context.lineTo(-6, 4);
    context.lineTo(-4, 0);
    context.lineTo(-6, -4);
    context.closePath();
    context.fill();
    context.restore();
  });
}

function drawMap() {
  const width = mapCanvas.clientWidth;
  const height = mapCanvas.clientHeight;

  mapCtx.clearRect(0, 0, width, height);
  mapCtx.fillStyle = "transparent";
  mapCtx.fillRect(0, 0, width, height);

  drawGrid(mapCtx, width, height);
  drawRoutes(mapCtx, width, height);
  drawPlanes(mapCtx, width, height);
  drawCities(mapCtx, width, height);

  requestAnimationFrame(drawMap);
}

function drawMiniMap() {
  if (!miniCanvas || !miniCtx) return;
  const width = miniCanvas.clientWidth;
  const height = miniCanvas.clientHeight;
  miniCtx.clearRect(0, 0, width, height);
  miniCtx.fillStyle = "#0b1b3b";
  miniCtx.fillRect(0, 0, width, height);
  miniCtx.strokeStyle = "rgba(125, 227, 255, 0.4)";
  miniCtx.lineWidth = 1;
  routesData.forEach(route => {
    const start = cities[route.from];
    const end = cities[route.to];
    miniCtx.beginPath();
    miniCtx.moveTo(start.x * width, start.y * height);
    miniCtx.lineTo(end.x * width, end.y * height);
    miniCtx.stroke();
  });
}

drawMap();
drawMiniMap();

function formatMoney(value) {
  return `${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })}亿`;
}

function updateMoneyDisplay() {
  if (moneyEl) moneyEl.textContent = formatMoney(money);
}

updateMoneyDisplay();

function calculateFinance() {
  shipCount = routesData.length;
  const paxPerShip = baseShip.capacity * baseShip.tripsPerMonth;
  const totalPax = paxPerShip * shipCount;
  const revenue = totalPax * baseShip.ticketPrice;
  const variableCost = totalPax * baseShip.variableCostPerPax;
  const fixedCost = baseShip.fixedCost * shipCount;
  const netProfit = revenue - variableCost - fixedCost;
  return { totalPax, revenue, variableCost, fixedCost, netProfit };
}

function renderFinance() {
  const { revenue, variableCost, fixedCost, netProfit } = calculateFinance();
  if (revRoutesEl) revRoutesEl.textContent = formatMoney(revenue);
  if (costOpsEl) costOpsEl.textContent = formatMoney(variableCost);
  if (costFixedEl) costFixedEl.textContent = formatMoney(fixedCost);
  if (netProfitEl) netProfitEl.textContent = formatMoney(netProfit);
}

function updateStats() {
  const { totalPax, netProfit } = calculateFinance();

  money += netProfit;
  pax += totalPax;
  util = Math.min(100, Math.max(60, util + 1));

  renderFinance();
  updateMoneyDisplay();
  if (incomeEl) incomeEl.textContent = `$${income.toLocaleString()}`;
  if (paxEl) paxEl.textContent = pax.toLocaleString();
  if (cargoEl) cargoEl.textContent = `${cargo}t`;
  if (utilEl) utilEl.textContent = `${Math.round(util)}%`;
}

function updateTimeDisplay() {
  if (!timeEl) return;
  timeEl.textContent = `${year}年${month}月`;
}

function advanceTurn() {
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  updateTimeDisplay();
  updateStats();
}

updateTimeDisplay();
renderFinance();
renderRoutesList();

if (btnRoute) {
  btnRoute.addEventListener("click", () => {
    routes += 1;
    shipCount = routes;
    if (routesEl) routesEl.textContent = routes;
    money = Math.max(0, money - 0.12);
    updateMoneyDisplay();
  });
}

if (btnShip) {
  btnShip.addEventListener("click", () => {
    money = Math.max(0, money - 0.08);
    updateMoneyDisplay();
    const row = document.createElement("div");
    row.className = "fleet-row";
    row.innerHTML = `
      <div>地月 ${String(routes + 3).padStart(2, "0")} · 运载舰</div>
      <div>状态: 待命</div>
      <div>载货: 60t</div>
      <div>航线: 新开辟</div>
    `;
    fleetTable.appendChild(row);
  });
}

if (btnUpgrade) {
  btnUpgrade.addEventListener("click", () => {
    util = Math.min(98, util + 4);
    if (utilEl) utilEl.textContent = `${Math.round(util)}%`;
  });
}

if (btnScan) {
  btnScan.addEventListener("click", () => {
    income += 25000;
    if (incomeEl) incomeEl.textContent = `$${income.toLocaleString()}`;
  });
}

if (btnFinance) {
  let financed = false;
  btnFinance.addEventListener("click", () => {
    if (financed) return;
    const confirmed = window.confirm("是否资本市场融资 9 亿？");
    if (!confirmed) return;
    money += 9;
    financed = true;
    updateMoneyDisplay();
  });
}
 
if (btnNextMonth) {
  btnNextMonth.addEventListener("click", () => {
    advanceTurn();
  });
}

mapCanvas.addEventListener("mousemove", event => {
  const rect = mapCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  const hit = cities.find(city => Math.hypot(city.x - x, city.y - y) < 0.03);
  if (hit) {
    hoverTip.style.opacity = "1";
    hoverTip.style.left = `${event.clientX - rect.left}px`;
    hoverTip.style.top = `${event.clientY - rect.top}px`;
    hoverTip.textContent = `港口: ${hit.name}`;
  } else {
    hoverTip.style.opacity = "0";
  }
});

mapCanvas.addEventListener("mouseleave", () => {
  hoverTip.style.opacity = "0";
});

})();

mapCanvas.addEventListener("click", event => {
  if (moonPortIndex === -1) return;
  const rect = mapCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  const hitWuhan = wuhanIndex !== -1 && Math.hypot(cities[wuhanIndex].x - x, cities[wuhanIndex].y - y) < 0.03;
  const hitBangkok = bangkokIndex !== -1 && Math.hypot(cities[bangkokIndex].x - x, cities[bangkokIndex].y - y) < 0.03;
  if (hitWuhan || hitBangkok) {
    const confirmed = window.confirm("是否建立地月航线？");
    if (confirmed) {
      const fromIndex = hitWuhan ? wuhanIndex : bangkokIndex;
      const exists = routesData.some(route =>
        (route.from === fromIndex && route.to === moonPortIndex) ||
        (route.from === moonPortIndex && route.to === fromIndex)
      );
      if (!exists) {
        const totalCost = baseShip.purchaseCost + baseInfrastructureCost;
        if (money < totalCost) {
          window.alert("资金不足，请过回合或者资本市场融资");
          return;
        }
        money = Math.max(0, money - totalCost);
        updateMoneyDisplay();
        routesData.push({ from: fromIndex, to: moonPortIndex, t: 0, speed: 0.00022 });
        routes += 1;
        shipCount = routes;
        if (routesEl) routesEl.textContent = routes;
        renderRoutesList();
        showReward("星途漫漫，唯有坚持让航线抵达彼岸。", "✨");
      }
    }
  }

});
