(function () {
	var canvas = document.getElementById('star-bg-canvas');
	if (!canvas) {
		return;
	}

	var ctx = canvas.getContext('2d');
	if (!ctx) {
		return;
	}

	var stars = [];
	var STAR_COUNT = 220;
	var width = 0;
	var height = 0;

	function resize() {
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		stars = [];
		for (var i = 0; i < STAR_COUNT; i++) {
			stars.push({
				x: Math.random() * width,
				y: Math.random() * height,
				r: Math.random() * 1.4 + 0.2,
				s: Math.random() * 0.28 + 0.04,
				a: Math.random() * 0.55 + 0.25
			});
		}
	}

	function update() {
		for (var i = 0; i < stars.length; i++) {
			var star = stars[i];
			star.x += star.s;
			if (star.x > width) {
				star.x = -2;
				star.y = Math.random() * height;
			}
		}
	}

	function draw() {
		ctx.clearRect(0, 0, width, height);
		for (var i = 0; i < stars.length; i++) {
			var star = stars[i];
			ctx.beginPath();
			ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(255,255,255,' + star.a + ')';
			ctx.fill();
		}
	}

	function tick() {
		update();
		draw();
		window.requestAnimationFrame(tick);
	}

	resize();
	tick();
	window.addEventListener('resize', resize);
})();
