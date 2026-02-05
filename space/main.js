// =======================
// space main.js — responsive starfield, Earth/Moon, and auto-ship
// =======================
const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');

let dpr = window.devicePixelRatio || 1;
let cssWidth = 800;
let cssHeight = 400;

function resizeCanvas() {
	dpr = window.devicePixelRatio || 1;
	const parent = canvas.parentElement;
	cssWidth = parent ? parent.clientWidth : window.innerWidth;
	// fill available parent height if possible, else viewport height
	cssHeight = parent ? (parent.clientHeight || window.innerHeight) : window.innerHeight;

	canvas.style.width = cssWidth + 'px';
	canvas.style.height = cssHeight + 'px';

	canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
	canvas.height = Math.max(1, Math.floor(cssHeight * dpr));

	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
	updateShip(pos.earthX, pos.earthY, pos.moonX, pos.moonY);
	drawShip();
	requestAnimationFrame(animate);
}

// startup
resizeCanvas();
initStars();
initShip();
animate();

window.addEventListener('resize', () => {
	resizeCanvas();
	initStars();
	initShip();
});

