// ===== 游戏状态 =====
let gameState = {
  credits: 5000,
  population: 100,
  baseProduction: 0,
  progress: 0,          // 总进度
  stageIndex: 0,        // 当前阶段索引
  currentLocation: 'earth',  // 当前采矿地点
  locationResources: {   // 各地点的采矿数据
    earth: { name: '地球', multiplier: 1.0, efficiency: '标准', unlocked: true, image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1000&h=700&fit=crop' },
    moon: { name: '月球', multiplier: 5.0, efficiency: '高效', unlocked: false, image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1000&h=700&fit=crop' },
    mars: { name: '火星', multiplier: 7.5, efficiency: '丰富', unlocked: false, image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1000&h=700&fit=crop' },
    asteroid: { name: '小行星带', multiplier: 10.0, efficiency: '极丰', unlocked: false, image: 'https://images.unsplash.com/photo-1462331940975-21fda91d3200?w=1000&h=700&fit=crop' },
    europa: { name: '木卫二', multiplier: 15.0, efficiency: '稀有', unlocked: false, image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=1000&h=700&fit=crop' },
    uranus: { name: '天王星', multiplier: 25.0, efficiency: '奇异', unlocked: false, image: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=1000&h=700&fit=crop' },
    neptune: { name: '海王星', multiplier: 40.0, efficiency: '极致', unlocked: false, image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1000&h=700&fit=crop' },
    kuiper: { name: '柯伊伯带', multiplier: 100.0, efficiency: '传奇', unlocked: false, image: 'https://images.unsplash.com/photo-1462331940975-21fda91d3200?w=1000&h=700&fit=crop' },
  },
  buildings: {
    robot: { name: "增加机器人", level: 0, cost: 500, clickBonus: 10, icon: "🤖" },
    solar: { name: "卫星光伏能源站", level: 0, cost: 1500, clickBonus: 20, icon: "🛰️" },
  },
  planets: [
    {
      id: "mercury",
      name: "水星",
      emoji: "☀️",
      desc: "距太阳最近，蕴含丰富的稀有金属资源",
      cost: 1000,
      requirement: "需要太空港等级 ≥ 1",
      requiredBuilding: "starport",
      requiredLevel: 1,
      colonized: false,
      productionBonus: 1.2,
    },
    {
      id: "venus",
      name: "金星",
      emoji: "🌫️",
      desc: "厚重大气，存在特殊矿物资源",
      cost: 2000,
      requirement: "需要太空港等级 ≥ 2，采矿厂等级 ≥ 2",
      requiredBuilding: "starport",
      requiredLevel: 2,
      colonized: false,
      productionBonus: 1.5,
    },
    {
      id: "mars",
      name: "火星",
      emoji: "🔴",
      desc: "可能存在水冰和丰富的铁矿资源",
      cost: 1500,
      requirement: "需要太空港等级 ≥ 1",
      requiredBuilding: "starport",
      requiredLevel: 1,
      colonized: false,
      productionBonus: 1.3,
    },
    {
      id: "jupiter",
      name: "木星",
      emoji: "🪐",
      desc: "太阳系最大行星，拥有丰富的气态资源",
      cost: 5000,
      requirement: "需要太空港等级 ≥ 3，研究中心等级 ≥ 2",
      requiredBuilding: "starport",
      requiredLevel: 3,
      colonized: false,
      productionBonus: 2.0,
    },
    {
      id: "saturn",
      name: "土星",
      emoji: "💍",
      desc: "行星环由冰和岩石组成，是能源的宝库",
      cost: 6000,
      requirement: "需要太空港等级 ≥ 3，工厂等级 ≥ 2",
      requiredBuilding: "starport",
      requiredLevel: 3,
      colonized: false,
      productionBonus: 2.2,
    },
  ],
};

// ===== 阶段系统 =====
const stages = [
  {
    id: "stage1",
    name: "近地轨道与月球前哨",
    need: 25,
    mood: "哲学",
    emoji: "🌍",
    title: "从轨道俯视地球",
    text: "我们第一次从太空俯视自己的家园，城市的灯光像一层薄薄的霜，文明在黑暗的背景上显得格外脆弱。",
  },
  {
    id: "stage2",
    name: "火星与小行星带边缘",
    need: 75,
    mood: "哲学",
    emoji: "🔴",
    title: "红色边界",
    text: "火星的薄雾在天边铺开。我们第一次把岩石写进资产负债表，也把风险写进文明的脚注。",
  },
  {
    id: "stage3",
    name: "小行星带采矿时代",
    need: 150,
    mood: "壮阔",
    emoji: "🪨",
    title: "璀璨的岩石带",
    text: "无数的岩石在太阳的微光中闪闪发光。这里没有重力，没有生命，只有无尽的资源和人类贪婪的欲望。",
  },
  {
    id: "stage4",
    name: "木卫二：冰下海洋之门",
    need: 300,
    mood: "燃",
    emoji: "❄️",
    title: "为了一片看不见的海",
    text: "在厚达数十公里的冰层下，也许有海流，有化学梯度，有某种不愿被阳光打扰的生命。这一次，我们不是为了矿藏，而是为了一个问题本身。",
  },
  {
    id: "stage5",
    name: "天王星与冰巨行星探索",
    need: 500,
    mood: "燃",
    emoji: "🌀",
    title: "冰风怒号",
    text: "天王星在极致的风暴中自转，其内部可能隐藏着人类未曾见过的物质和能源。我们已不再停留在观测阶段。",
  },
  {
    id: "stage6",
    name: "海王星与外太阳系边界",
    need: 750,
    mood: "燃",
    emoji: "🔷",
    title: "深蓝的终极",
    text: "海王星之外是一片漆黑。探测器的信号在这里变得极其微弱。我们正在推开太阳系的最后一道门。",
  },
  {
    id: "stage7",
    name: "柯伊伯带与人类的终局",
    need: 1000,
    mood: "升华",
    emoji: "⭐",
    title: "地平线的最终延伸",
    text: "柯伊伯带的冰冷彗星守卫着太阳系的边界。在这里，人类第一次真正拥抱了整个太阳系。从这里望向银河，地球已是一粒尘埃，文明却闪闪发光。",
  },
];

// ===== DOM 引用 =====
const creditsEl = document.getElementById("credits");
const populationEl = document.getElementById("population");
const productionEl = document.getElementById("production");
const techLevelEl = document.getElementById("tech-level");
const harvestBtn = document.getElementById("harvestBtn");
const harvestGainEl = document.getElementById("harvestGain");
const logDiv = document.getElementById("log");
const buildingsListEl = document.getElementById("buildingsList");
const planetsListEl = document.getElementById("planetsList");

const planetModal = document.getElementById("planetModal");
const modalPlanetName = document.getElementById("modalPlanetName");
const modalPlanetDesc = document.getElementById("modalPlanetDesc");
const modalPlanetReq = document.getElementById("modalPlanetReq");
const modalPlanetMission = document.getElementById("modalPlanetMission");
const colonizeBtn = document.getElementById("colonizeBtn");

const stageModal = document.getElementById("stageModal");
const modalStageTitle = document.getElementById("modalStageTitle");
const stageMood = document.getElementById("stageMood");
const stageText = document.getElementById("stageText");
const stageVisual = document.getElementById("stageVisual");
const stageNameEl = document.getElementById("stageName");
const progressPercentEl = document.getElementById("progressPercent");
const progressFillEl = document.getElementById("progressFill");

let currentPlanet = null;

// ===== 工具函数 =====
function addLog(text, type = "normal") {
  const line = document.createElement("div");
  line.className = `log-line ${type}`;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  logDiv.appendChild(line);
  logDiv.scrollTop = logDiv.scrollHeight;
}

function updateStatus() {
  creditsEl.textContent = Math.floor(gameState.credits).toLocaleString();
  populationEl.textContent = Math.floor(gameState.population);

  // 计算总产能
  let totalProduction = gameState.baseProduction;
  for (let key in gameState.buildings) {
    const building = gameState.buildings[key];
    totalProduction += building.level * building.production;
  }

  // 行星殖民加成
  const colonizedCount = gameState.planets.filter((p) => p.colonized).length;
  const planetBonus = colonizedCount * 0.5;
  totalProduction *= 1 + planetBonus;

  productionEl.textContent = totalProduction.toFixed(1);

  // 科技等级 = 所有建筑等级之和
  let techLevel = 1;
  for (let key in gameState.buildings) {
    techLevel += gameState.buildings[key].level;
  }
  techLevelEl.textContent = `Lv.${techLevel}`;

  // 更新进度条
  updateProgressBar();
}

function getTechLevel() {
  let level = 1;
  for (let key in gameState.buildings) {
    level += gameState.buildings[key].level;
  }
  return level;
}

// ===== 进度系统 =====
function updateProgressBar() {
  const currentStage = stages[gameState.stageIndex];
  const currentNeed = currentStage.need;
  const nextStageNeed = gameState.stageIndex < stages.length - 1 ? stages[gameState.stageIndex + 1].need : currentNeed;

  // 计算当前阶段的进度百分比
  const progressInStage = gameState.progress - (gameState.stageIndex > 0 ? stages[gameState.stageIndex - 1].need : 0);
  const stageRange = currentNeed - (gameState.stageIndex > 0 ? stages[gameState.stageIndex - 1].need : 0);
  const percent = Math.min(100, Math.max(0, (progressInStage / stageRange) * 100));

  progressFillEl.style.width = percent + "%";
  progressPercentEl.textContent = Math.floor(percent) + "%";
  stageNameEl.textContent = currentStage.name;
}

function checkStageProgress() {
  if (gameState.stageIndex >= stages.length) return;

  const currentStage = stages[gameState.stageIndex];
  if (gameState.progress >= currentStage.need) {
    // 推进到下一阶段
    if (gameState.stageIndex < stages.length - 1) {
      gameState.stageIndex += 1;
      showStageModal(stages[gameState.stageIndex]);
      addLog(
        `🌟 突破！进入新阶段：${stages[gameState.stageIndex].name}`,
        "success"
      );

      // 根据新阶段解锁新地点
      unlockLocationsByStage(gameState.stageIndex);
    }
  }
}

function showStageModal(stage) {
  modalStageTitle.textContent = stage.title;
  stageMood.textContent = stage.mood;
  stageText.textContent = stage.text;
  
  // 显示地点对应的背景图
  const locData = Object.values(gameState.locationResources)[gameState.stageIndex];
  
  if (locData) {
    stageVisual.style.backgroundImage = `url('${locData.image}')`;
    stageVisual.style.backgroundSize = 'cover';
    stageVisual.style.backgroundPosition = 'center';
  }
  
  stageModal.classList.remove("hidden");
}

function closeStageModal() {
  stageModal.classList.add("hidden");
}

// ===== 地点切换 =====
function switchLocation(location) {
  // 检查是否已解锁
  if (!gameState.locationResources[location].unlocked) {
    addLog(`🔒 ${gameState.locationResources[location].name} 还未解锁，请继续探索。`, "warning");
    return;
  }

  gameState.currentLocation = location;
  
  // 更新标签样式
  document.querySelectorAll('.location-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');

  // 更新按钮提示
  const locData = gameState.locationResources[location];
  harvestGainEl.textContent = Math.floor(10 * locData.multiplier);
  
  addLog(`📍 切换到 ${locData.name} 采矿点（${locData.efficiency}效率）`, "normal");
}

// ===== 地点解锁系统 =====
function unlockLocationsByStage(stageIndex) {
  const unlocks = [
    { index: 1, location: 'moon', message: '✨ 解锁新采矿点：🌙 月球！收益大幅提升（+50/次）' },
    { index: 2, location: 'mars', message: '✨ 解锁新采矿点：🔴 火星！收益极其丰富（+75/次）' },
    { index: 3, location: 'asteroid', message: '✨ 解锁新采矿点：🪨 小行星带！无尽资源（+100/次）' },
    { index: 4, location: 'europa', message: '✨ 解锁新采矿点：❄️ 木卫二！稀有矿物（+150/次）' },
    { index: 5, location: 'uranus', message: '✨ 解锁新采矿点：🌀 天王星！奇异物质（+250/次）' },
    { index: 6, location: 'neptune', message: '✨ 解锁新采矿点：🔷 海王星！极致能源（+400/次）' },
    { index: 7, location: 'kuiper', message: '⭐ 解锁终极采矿点：⭐ 柯伊伯带！传奇财富（+1000/次）' },
  ];

  unlocks.forEach(unlock => {
    if (stageIndex >= unlock.index && !gameState.locationResources[unlock.location].unlocked) {
      gameState.locationResources[unlock.location].unlocked = true;
      const tabId = unlock.location + 'Tab';
      const tabEl = document.getElementById(tabId);
      if (tabEl) tabEl.style.display = 'inline-block';
      addLog(unlock.message, "success");
    }
  });
}

// ===== 点击开采 =====
harvestBtn.addEventListener("click", () => {
  const location = gameState.locationResources[gameState.currentLocation];
  const multiplier = location.multiplier;
  
  // 计算建筑加成
  let clickBonus = 10; // 基础值
  clickBonus += gameState.buildings.robot.level * gameState.buildings.robot.clickBonus;
  clickBonus += gameState.buildings.solar.level * gameState.buildings.solar.clickBonus;
  
  const gain = clickBonus * multiplier;
  
  gameState.credits += gain;
  gameState.progress += 5;  // 每次点击增加5进度（加快解锁）

  harvestGainEl.textContent = Math.floor(gain);

  updateStatus();
  checkStageProgress();
});

// ===== 建筑升级 =====
function upgradeBuildingListener(buildingKey) {
  return () => {
    const building = gameState.buildings[buildingKey];
    if (gameState.credits < building.cost) {
      addLog(`💰 资金不足，无法升级 ${building.name}。需要 ${Math.floor(building.cost)} 基金。`, "error");
      return;
    }

    gameState.credits -= building.cost;
    building.level += 1;

    // 升级造价指数增长
    building.cost = Math.ceil(building.cost * 1.15);

    const bonus = building.level * building.clickBonus;
    addLog(`✨ 升级了 ${building.name} 至 Lv.${building.level}，每次点击额外获得 +${bonus}。`, "success");
    updateStatus();
    renderBuildings();
    checkStageProgress();
  };
}

function renderBuildings() {
  buildingsListEl.innerHTML = "";

  for (let key in gameState.buildings) {
    const building = gameState.buildings[key];
    const canUpgrade = gameState.credits >= building.cost;
    const currentBonus = building.level * building.clickBonus;
    const nextBonus = (building.level + 1) * building.clickBonus;

    const item = document.createElement("div");
    item.className = `building-item ${canUpgrade ? "can-upgrade" : ""}`;

    item.innerHTML = `
      <div class="building-header">
        <span class="building-name">${building.icon} ${building.name}</span>
        <span class="building-level">Lv.${building.level}</span>
      </div>
      <div class="building-effect">每次点击: +${building.clickBonus} / 级 (当前 +${currentBonus})</div>
      <div class="building-cost">💰 升级费用: ${Math.floor(building.cost)}</div>
      <button class="building-btn" ${!canUpgrade ? "disabled" : ""} onclick="upgradeBuilding('${key}')">升级</button>
    `;

    buildingsListEl.appendChild(item);
  }
}

function upgradeBuilding(buildingKey) {
  upgradeBuildingListener(buildingKey)();
}

// ===== 行星殖民 =====
function renderPlanets() {
  planetsListEl.innerHTML = "";

  gameState.planets.forEach((planet) => {
    if (planet.colonized) {
      // 已殖民行星
      const item = document.createElement("div");
      item.className = "planet-item colonized";
      item.innerHTML = `
        <div class="planet-name">${planet.emoji} ${planet.name}</div>
        <div class="planet-status done">✓ 已殖民</div>
        <div class="planet-info">产能加成: +${(planet.productionBonus - 1) * 100}%</div>
      `;
      planetsListEl.appendChild(item);
    } else {
      // 未殖民行星
      const item = document.createElement("div");
      item.className = "planet-item";
      item.style.cursor = "pointer";
      item.innerHTML = `
        <div class="planet-name">${planet.emoji} ${planet.name}</div>
        <div class="planet-info">${planet.desc}</div>
        <div class="planet-status">点击规划殖民</div>
      `;
      item.onclick = () => openPlanetModal(planet);
      planetsListEl.appendChild(item);
    }
  });
}

function openPlanetModal(planet) {
  currentPlanet = planet;

  modalPlanetName.textContent = `${planet.emoji} ${planet.name}`;
  modalPlanetDesc.textContent = planet.desc;
  modalPlanetReq.textContent = `💰 殖民费用: ${planet.cost} 基金 | ${planet.requirement}`;
  modalPlanetMission.innerHTML = `
    <strong>殖民后效果：</strong><br>
    • 产能加成: +${(planet.productionBonus - 1) * 100}%<br>
    • 每次殖民可进一步扩展太空领地
  `;

  // 检查是否能殖民
  const requiredBuilding = gameState.buildings[planet.requiredBuilding];
  const canColonize =
    gameState.credits >= planet.cost && requiredBuilding.level >= planet.requiredLevel;

  colonizeBtn.disabled = !canColonize;
  if (!canColonize) {
    if (gameState.credits < planet.cost) {
      colonizeBtn.textContent = "资金不足";
    } else {
      colonizeBtn.textContent = `需要 ${planet.requiredBuilding.toUpperCase()} Lv.${planet.requiredLevel}`;
    }
  } else {
    colonizeBtn.textContent = "开始殖民";
  }

  planetModal.classList.remove("hidden");
}

function closePlanetModal() {
  planetModal.classList.add("hidden");
  currentPlanet = null;
}

colonizeBtn.addEventListener("click", () => {
  if (!currentPlanet) return;

  const planet = currentPlanet;
  const requiredBuilding = gameState.buildings[planet.requiredBuilding];

  if (gameState.credits < planet.cost) {
    addLog(`💰 资金不足，无法殖民 ${planet.name}。`, "error");
    return;
  }

  if (requiredBuilding.level < planet.requiredLevel) {
    addLog(`🏗️ 需要更高的科技等级才能殖民 ${planet.name}。`, "error");
    return;
  }

  // 执行殖民
  gameState.credits -= planet.cost;
  planet.colonized = true;

  addLog(`🌍 成功殖民 ${planet.name}！获得 +${(planet.productionBonus - 1) * 100}% 产能加成。`, "success");

  // 殖民也增加进度
  gameState.progress += 20;

  // 检查全部殖民
  const allColonized = gameState.planets.every((p) => p.colonized);
  if (allColonized) {
    addLog("⭐ 伟大成就：你已殖民整个太阳系！人类的太空帝国已成形。", "success");
  }

  updateStatus();
  renderPlanets();
  closePlanetModal();
  checkStageProgress();  // 检查阶段进度
});

// 弹窗外部点击关闭
planetModal.addEventListener("click", (e) => {
  if (e.target === planetModal) {
    closePlanetModal();
  }
});

// ===== 被动产出 =====
setInterval(() => {
  let totalProduction = gameState.baseProduction;

  // 建筑产出
  for (let key in gameState.buildings) {
    const building = gameState.buildings[key];
    totalProduction += building.level * building.production;
  }

  // 行星加成
  const colonizedCount = gameState.planets.filter((p) => p.colonized).length;
  const planetBonus = colonizedCount * 0.5;
  totalProduction *= 1 + planetBonus;

  // 添加到基金
  gameState.credits += totalProduction;

  // 人口自然增长
  gameState.population += colonizedCount * 2;

  updateStatus();
}, 1000);

// ===== 初始化 =====
addLog("🚀 欢迎来到星际殖民官！这是人类向太阳系扩张的开始。");
addLog("💡 提示：点击开采资源获得基金，升级建筑提升产能，然后殖民行星扩大优势。");
addLog("📈 阶段进度会随着你的探索而推进，解锁新的故事与目标。");
updateStatus();
renderBuildings();
renderPlanets();
showStageModal(stages[0]);  // 显示第一个阶段的故事
