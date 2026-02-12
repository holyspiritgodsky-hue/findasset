(function () {
	var canvas = document.getElementById('orbit-overlay-canvas');
	if (!canvas) {
		return;
	}

	var ctx = canvas.getContext('2d');
	if (!ctx) {
		return;
	}

	var moonImg = new Image();
	moonImg.onerror = function () {
		moonImg.onerror = null;
		moonImg.src = 'img/moon.jpg';
	};
	moonImg.src = 'img/moon.png';

	var width = 0;
	var height = 0;
	var miningFx = {
		active: false,
		start: 0,
		duration: 850,
		flameDuration: 450
	};

	function triggerMiningFx() {
		miningFx.active = true;
		miningFx.start = performance.now();
	}

	function resize() {
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
	}

	function drawPlanetFallback(x, y, radius, coreColor, edgeColor, alpha) {
		ctx.save();
		ctx.globalAlpha = alpha;
		var gradient = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.25, radius * 0.2, x, y, radius);
		gradient.addColorStop(0, coreColor);
		gradient.addColorStop(1, edgeColor);
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fillStyle = gradient;
		ctx.fill();
		ctx.restore();
	}

	function drawMiningDrone(moonX, moonY, moonR, now) {
		var hover = Math.sin(now / 500) * 2;
		var droneX = moonX + moonR * 0.2;
		var droneY = moonY - moonR * 1.6 + hover;
		var bodyR = Math.max(4, moonR * 0.24);
		var fxTime = now - miningFx.start;

		if (miningFx.active && fxTime >= miningFx.duration) {
			miningFx.active = false;
		}

		ctx.save();
		ctx.globalAlpha = 0.9;
		ctx.translate(droneX, droneY);
		ctx.fillStyle = 'rgba(196,236,255,0.95)';
		ctx.beginPath();
		ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = 'rgba(90,170,255,0.95)';
		ctx.fillRect(-bodyR - 5, -2, 5, 4);
		ctx.fillRect(bodyR, -2, 5, 4);

		ctx.fillStyle = 'rgba(16,38,78,0.9)';
		ctx.beginPath();
		ctx.arc(0, 0, bodyR * 0.42, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();

		if (miningFx.active && fxTime < miningFx.flameDuration) {
			var pulse = 0.58 + 0.42 * Math.sin(fxTime / 70);
			var flameLen = bodyR * (1.4 + 0.45 * Math.sin(fxTime / 52));
			var flameX = droneX;
			var flameY = droneY + bodyR * 0.9;
			var grad = ctx.createLinearGradient(flameX, flameY, flameX, flameY + flameLen);
			grad.addColorStop(0, 'rgba(255,220,120,' + (0.85 * pulse) + ')');
			grad.addColorStop(1, 'rgba(255,90,20,0)');
			ctx.fillStyle = grad;
			ctx.beginPath();
			ctx.moveTo(flameX - bodyR * 0.35, flameY);
			ctx.lineTo(flameX, flameY + flameLen);
			ctx.lineTo(flameX + bodyR * 0.35, flameY);
			ctx.closePath();
			ctx.fill();
		}

		if (miningFx.active && fxTime < miningFx.duration) {
			var beamPulse = 0.55 + 0.45 * Math.sin(fxTime / 80);
			var beamStartX = droneX;
			var beamStartY = droneY + bodyR * 0.65;
			var beamEndX = moonX + moonR * 0.1;
			var beamEndY = moonY + moonR * 0.32;
			var beamGrad = ctx.createLinearGradient(beamStartX, beamStartY, beamEndX, beamEndY);
			beamGrad.addColorStop(0, 'rgba(140,255,220,' + (0.82 * beamPulse) + ')');
			beamGrad.addColorStop(1, 'rgba(40,120,255,0)');
			ctx.strokeStyle = beamGrad;
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo(beamStartX, beamStartY);
			ctx.lineTo(beamEndX, beamEndY);
			ctx.stroke();
		}
	}

	function draw(now) {
		ctx.clearRect(0, 0, width, height);

		var moonX = width * 0.5;
		var moonY = height * 0.72;
		var moonR = Math.min(width, height) * 0.09;

		if (moonImg.complete && moonImg.naturalWidth > 0) {
			ctx.save();
			ctx.globalAlpha = 0.85;
			ctx.beginPath();
			ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
			ctx.clip();
			ctx.drawImage(moonImg, moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
			ctx.restore();
		} else {
			drawPlanetFallback(moonX, moonY, moonR, '#d7dbe5', 'rgba(255,255,255,0.06)', 0.75);
		}

		drawMiningDrone(moonX, moonY, moonR, now);
	}

	function tick(now) {
		draw(now);
		window.requestAnimationFrame(tick);
	}

	document.addEventListener('click', function (event) {
		var gather = event.target && event.target.closest ? event.target.closest('#gatherButton') : null;
		if (gather) {
			triggerMiningFx();
		}
	}, true);

	resize();
	window.addEventListener('resize', resize);
	window.requestAnimationFrame(tick);
})();
