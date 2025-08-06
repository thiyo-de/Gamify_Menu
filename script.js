const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Constants
const EFFECTS_DURATION = 1.5;
const MAX_PULL = 80;
const MAX_BOW_ANGLE = Math.PI / 2; // 90 degrees left and right from center

// Game elements
const arrowImg = document.getElementById("arrowImage");
const bgMusic = document.getElementById("bgMusic");
const shootSound = document.getElementById("shootSound");
const hitSound = document.getElementById("hitSound");
const missSound = document.getElementById("missSound");
const pullSound = document.getElementById("pullSound");
pullSound.volume = 0.3;

let arrows = [];
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;
let pullStrength = 0;
let isPullingSoundPlaying = false;

// --- Difficulty Settings ---
const difficultySpeeds = {
  noob: 1.5, // very slow
  easy: 2.5, // normal
  veteran: 3.5, // fast
};

// Default difficulty
let currentDifficulty = "easy";

// --- Menu targets with SVG icons + tooltips ---
let menuTargets = [
  { icon: "assets/icon1.svg", tooltip: "Agri", url: "#love" },
  { icon: "assets/icon2.svg", tooltip: "Arts", url: "#music" },
  { icon: "assets/icon3.svg", tooltip: "CI", url: "#camera" },
  { icon: "assets/icon4.svg", tooltip: "Design", url: "#star" },
  { icon: "assets/icon5.svg", tooltip: "Engineering", url: "#gift" },
  { icon: "assets/icon6.svg", tooltip: "Entreprenurship", url: "#rocket" },
  { icon: "assets/icon7.svg", tooltip: "Law", url: "#heart" },
  { icon: "assets/icon8.svg", tooltip: "Health", url: "#smile" },
  { icon: "assets/icon9.svg", tooltip: "Nursing", url: "#game" },
  { icon: "assets/icon10.svg", tooltip: "Pharmacy", url: "#book" },
].map((item) => {
  const iconSize = 50;
  return {
    ...item,
    x: Math.random() * (canvas.width - iconSize - 40) + 20,
    y: Math.random() * (canvas.height / 2 - iconSize - 20) + 20,
    width: iconSize,
    height: iconSize,
    vx: (Math.random() - 0.5) * 2 * difficultySpeeds[currentDifficulty],
    vy: (Math.random() - 0.5) * 2 * difficultySpeeds[currentDifficulty],
    element: null,
    tooltipEl: null,
    angle: Math.random() * Math.PI * 2,
  };
});

// --- Create icon & tooltip HTML elements ---
menuTargets.forEach((target) => {
  // Icon
  target.element = document.createElement("img");
  target.element.src = target.icon;
  target.element.className = "icon-target";
  target.element.style.left = target.x + "px";
  target.element.style.top = target.y + "px";
  document.body.appendChild(target.element);

  // Tooltip
  target.tooltipEl = document.createElement("div");
  target.tooltipEl.innerText = target.tooltip;
  target.tooltipEl.className = "tooltip";
  document.body.appendChild(target.tooltipEl);
});

function toggleDifficultyMenu() {
  const menu = document.getElementById("difficultyOptions");
  const container = document.getElementById("difficultySelect");

  const isOpen = menu.classList.toggle("show");

  if (isOpen) {
    container.classList.remove("closed");
  } else {
    container.classList.add("closed");
  }
}

document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("difficultySelect");
  if (!dropdown.contains(e.target)) {
    document.getElementById("difficultyOptions").classList.remove("show");
    dropdown.classList.add("closed");
  }
});

// Start in closed state
document.getElementById("difficultySelect").classList.add("closed");

// --- Change difficulty with unique sound per difficulty ---
function setDifficulty(level) {
  // Play the correct sound for this difficulty
  const sounds = {
    noob: document.getElementById("difficultySoundNoob"),
    easy: document.getElementById("difficultySoundEasy"),
    veteran: document.getElementById("difficultySoundVeteran"),
  };

  if (sounds[level]) {
    sounds[level].currentTime = 0;
    sounds[level]
      .play()
      .catch((e) => console.log(`Sound for ${level} failed:`, e));
  }

  // Update current difficulty
  currentDifficulty = level;
  document.getElementById("difficultyCurrent").innerText = `Difficulty: ${
    level.charAt(0).toUpperCase() + level.slice(1)
  } ▼`;

  // Update speeds
  menuTargets.forEach((t) => {
    t.vx = (Math.random() - 0.5) * 2 * difficultySpeeds[level];
    t.vy = (Math.random() - 0.5) * 2 * difficultySpeeds[level];
  });

  // Highlight active option
  document.querySelectorAll("#difficultyOptions div").forEach((opt) => {
    opt.classList.remove("active");
    if (opt.innerText.toLowerCase().includes(level)) {
      opt.classList.add("active");
    }
  });

  // Close dropdown
  document.getElementById("difficultyOptions").classList.add("hidden");
}

let bow = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  angle: -Math.PI / 2, // Initialize pointing straight up
};

// Create floating particles
for (let i = 0; i < 120; i++) {
  const dot = document.createElement("div");
  dot.className = "particle";
  dot.style.left = `${Math.random() * window.innerWidth}px`;
  dot.style.animationDuration = `${5 + Math.random() * 15}s`;
  dot.style.opacity = Math.random();
  document.body.appendChild(dot);
}

// Event Listeners
canvas.addEventListener("mousedown", (e) => {
  isMouseDown = true;
  startPullSound();
});

canvas.addEventListener("mouseup", (e) => {
  if (isMouseDown) {
    shootArrow(e.clientX, e.clientY);
    stopPullSound();
  }
  isMouseDown = false;
});

canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  // Calculate angle with limits
  let angle = Math.atan2(mouseY - bow.y, mouseX - bow.x);

  // Constrain angle to 180 degrees (-90° to +90° from vertical)
  angle = Math.max(-Math.PI, Math.min(angle, 0)); // Limit to upward angles (-π to 0)

  // Fix flipping when mouse is at bottom left
  if (mouseX < bow.x && mouseY > bow.y) {
    angle = -Math.PI; // Point straight left
  } else if (mouseX > bow.x && mouseY > bow.y) {
    angle = 0; // Point straight right
  }

  bow.angle = angle;
});

// Touch events
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  isMouseDown = true;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  mouseX = touchStartX;
  mouseY = touchStartY;
  startPullSound();
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  mouseX = touch.clientX;
  mouseY = touch.clientY;

  const dx = mouseX - touchStartX;
  const dy = mouseY - touchStartY;
  pullStrength = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_PULL);

  // Calculate angle with limits
  let angle = Math.atan2(mouseY - bow.y, mouseX - bow.x);
  angle = Math.max(-Math.PI, Math.min(angle, 0)); // Limit to upward angles (-π to 0)

  // Fix flipping when touch is at bottom left
  if (mouseX < bow.x && mouseY > bow.y) {
    angle = -Math.PI; // Point straight left
  } else if (mouseX > bow.x && mouseY > bow.y) {
    angle = 0; // Point straight right
  }

  bow.angle = angle;
});

canvas.addEventListener("touchend", (e) => {
  if (isMouseDown) {
    shootArrow(mouseX, mouseY);
    stopPullSound();
  }
  isMouseDown = false;
});

// Keyboard controls (removed spacebar functionality)
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") bow.angle = Math.max(bow.angle - 0.1, -Math.PI);
  if (e.key === "ArrowRight") bow.angle = Math.min(bow.angle + 0.1, 0);
});

// Sound control functions
function startPullSound() {
  if (!isPullingSoundPlaying) {
    pullSound.currentTime = 0;
    pullSound.loop = true;
    pullSound.play().catch((e) => console.log("Pull sound error:", e));
    isPullingSoundPlaying = true;
  }
}

function stopPullSound() {
  if (isPullingSoundPlaying) {
    pullSound.pause();
    isPullingSoundPlaying = false;
  }
}

// Music toggle
const musicToggle = document.getElementById("musicToggle");
let musicPlaying = false;

musicToggle.addEventListener("click", (e) => {
  e.preventDefault();
  if (musicPlaying) {
    bgMusic.pause();
    musicToggle.textContent = "🎵 Music: Off";
  } else {
    bgMusic.play().catch((e) => console.log("Audio play failed:", e));
    musicToggle.textContent = "🎵 Music: On";
  }
  musicPlaying = !musicPlaying;
});

// Game functions
function shootArrow(targetX, targetY) {
  const angle = bow.angle;
  arrows.push({
    x: bow.x,
    y: bow.y,
    angle,
    speed: 5 + pullStrength / 5,
    strength: pullStrength,
  });
  shootSound.currentTime = 0;
  shootSound.play();
  pullStrength = 0;

  // Create string release effect
  createStringReleaseEffect(bow.x, bow.y, angle);
}

function createStringReleaseEffect(x, y, angle) {
  const particles = 5;
  for (let i = 0; i < particles; i++) {
    const particle = document.createElement("div");
    particle.className = "string-pull";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    document.body.appendChild(particle);

    const distance = 10 + Math.random() * 20;
    const duration = 0.2 + Math.random() * 0.3;
    const angleVariation = (Math.random() - 0.5) * 0.2;

    gsap.to(particle, {
      x: `+=${Math.cos(angle + angleVariation) * distance}`,
      y: `+=${Math.sin(angle + angleVariation) * distance}`,
      opacity: 0,
      scale: 0,
      duration: duration,
      onComplete: () => particle.remove(),
    });
  }
}

function showEffect(selector, x, y, scale = 1) {
  const effect = document.querySelector(selector);
  if (!effect) return;

  gsap.set(effect, {
    left: `${x}px`,
    top: `${y}px`,
    opacity: 1,
    scale: 0.5,
    display: "block",
  });

  gsap.to(effect, {
    opacity: 0,
    scale: scale,
    duration: EFFECTS_DURATION,
    ease: "power2.out",
    onComplete: () => {
      gsap.set(effect, { display: "none" });
    },
  });
}

function drawMissMessage() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * (canvas.height / 2);
  showEffect(".miss", x, y, 1.5);
  missSound.currentTime = 0;
  missSound.play();
}

function drawBullseye(x, y, strength) {
  showEffect(".bullseye", x, y, strength / 30);
  hitSound.currentTime = 0;
  hitSound.play();

  // Create hit message
  const hitMessages = ["Bullseye!", "Perfect!", "Great Shot!", "Awesome!"];
  const message = hitMessages[Math.floor(Math.random() * hitMessages.length)];

  const hitText = document.createElement("div");
  hitText.className = "hit-message";
  hitText.textContent = message;
  hitText.style.left = `${x}px`;
  hitText.style.top = `${y}px`;
  document.body.appendChild(hitText);

  gsap.fromTo(
    hitText,
    {
      opacity: 1,
      y: 0,
      scale: 0.8,
    },
    {
      opacity: 0,
      y: -100,
      scale: 1.2,
      duration: EFFECTS_DURATION,
      ease: "power2.out",
      onComplete: () => hitText.remove(),
    }
  );
}

function drawBow() {
  ctx.save();
  ctx.translate(bow.x, bow.y);
  ctx.rotate(bow.angle);
  ctx.scale(-1, 1);

  // --- Scale factor for bigger bow & string ---
  const scaleFactor = 1.3; // Increase this to make bow bigger

  // --- Draw bow.svg image ---
  const bowImg = document.getElementById("bowImage");
  const bowWidth = (bowImg.naturalWidth || 60) * scaleFactor;
  const bowHeight = (bowImg.naturalHeight || 120) * scaleFactor;
  ctx.drawImage(bowImg, -bowWidth / 2, -bowHeight / 2, bowWidth, bowHeight);

  // === String Anchors (matched to bow limb tips like sample) ===
  // These offsets are tuned to match inner notches visually
  const tipOffsetX = -bowWidth / 2 + 14 * scaleFactor; // inward from left
  const tipOffsetYTop = -bowHeight / 2 + 12 * scaleFactor; // down from top tip
  const tipOffsetYBottom = bowHeight / 2 - 12 * scaleFactor; // up from bottom tip

  // --- Create blue → cyan → blue gradient ---
  const gradient = ctx.createLinearGradient(
    15 * scaleFactor,
    tipOffsetYTop,
    15 * scaleFactor,
    tipOffsetYBottom
  );
  gradient.addColorStop(0, "#4A6CF7");
  gradient.addColorStop(0.5, "#21E6E6");
  gradient.addColorStop(1, "#4A6CF7");

  // Draw the string
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.5 * scaleFactor;
  ctx.beginPath();
  ctx.moveTo(20 * scaleFactor, tipOffsetYTop); // Top tip
  ctx.lineTo(pullStrength + 20 * scaleFactor, 0); // Pulled middle
  ctx.lineTo(20 * scaleFactor, tipOffsetYBottom); // Bottom tip
  ctx.stroke();

  ctx.restore();
}

function drawArrow(arrow) {
  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  ctx.rotate(arrow.angle);
  ctx.rotate(Math.PI / 2);

  // Add glow effect
  ctx.shadowColor = "gold";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  const w = arrowImg.naturalWidth || 60;
  const h = (arrowImg.naturalHeight || 20) / 2;
  ctx.drawImage(arrowImg, -w / 2, -h / 2, w, h);

  ctx.restore();
}

const compass = document.getElementById("compass");

document.addEventListener("mousemove", (e) => {
  const rect = compass.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  compass.style.transform = `rotate(${angle}deg)`;
});

// --- Draw and move targets ---
function drawMenuTargets() {
  const screenPadding = 20;
  const targetPadding = 15;

  for (let i = 0; i < menuTargets.length; i++) {
    const a = menuTargets[i];

    // Movement
    a.x += a.vx;
    a.y += a.vy;

    // Boundary bounce
    if (a.x <= screenPadding) a.vx = Math.abs(a.vx);
    if (a.x + a.width >= canvas.width - screenPadding) a.vx = -Math.abs(a.vx);
    if (a.y <= screenPadding) a.vy = Math.abs(a.vy);
    if (a.y + a.height >= canvas.height / 2 - screenPadding)
      a.vy = -Math.abs(a.vy);

    // Collision with other targets
    for (let j = i + 1; j < menuTargets.length; j++) {
      const b = menuTargets[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      const minDist = (a.width + b.width) / 2 + targetPadding;

      if (distance < minDist) {
        const angle = Math.atan2(dy, dx);
        const overlap = (minDist - distance) / 2;
        a.x -= Math.cos(angle) * overlap;
        a.y -= Math.sin(angle) * overlap;
        b.x += Math.cos(angle) * overlap;
        b.y += Math.sin(angle) * overlap;
        [a.vx, b.vx] = [b.vx, a.vx];
        [a.vy, b.vy] = [b.vy, a.vy];
      }
    }

    // Update icon position
    if (a.element) {
      a.element.style.left = `${a.x}px`;
      a.element.style.top = `${a.y}px`;
    }

    // Tooltip always moves relative to icon
    if (a.tooltipEl) {
      a.angle += 0.01; // orbit speed
      const radius = 40; // distance from icon center
      const tooltipX = a.x + a.width / 2 + Math.cos(a.angle) * radius;
      const tooltipY = a.y + a.height / 2 + Math.sin(a.angle) * radius;

      a.tooltipEl.style.left = `${tooltipX - a.tooltipEl.offsetWidth / 2}px`;
      a.tooltipEl.style.top = `${tooltipY - a.tooltipEl.offsetHeight / 2}px`;
    }
  }
}

function checkCollision(arrow, target) {
  return (
    arrow.x > target.x &&
    arrow.x < target.x + target.width &&
    arrow.y > target.y &&
    arrow.y < target.y + target.height
  );
}

function triggerExplosion(x, y) {
  hitSound.currentTime = 0;
  hitSound.play();

  const particles = 20;
  for (let i = 0; i < particles; i++) {
    const particle = document.createElement("div");
    particle.className = "explosion-particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    document.body.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 50;
    const duration = 0.5 + Math.random() * 0.5;

    gsap.to(particle, {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity: 0,
      scale: 0,
      duration: duration,
      onComplete: () => particle.remove(),
    });
  }
}

function animateTargetHit(target) {
  const pulse = document.createElement("div");
  pulse.className = "menu-glow";
  pulse.style.position = "absolute";
  pulse.style.left = `${target.x}px`;
  pulse.style.top = `${target.y}px`;
  pulse.style.width = `${target.width}px`;
  pulse.style.height = `${target.height}px`;
  pulse.style.borderRadius = "100px";
  pulse.style.border = "2px solid gold";
  pulse.style.zIndex = 10;
  document.body.appendChild(pulse);

  gsap.to(pulse, {
    opacity: 0,
    scale: 1.5,
    duration: 0.8,
    onComplete: () => pulse.remove(),
  });
}

function handleTargetCollisions() {
  const targetPadding = 15;
  const screenPadding = 20;

  for (let i = 0; i < menuTargets.length; i++) {
    const a = menuTargets[i];

    // First check screen boundaries
    if (a.x <= screenPadding) a.vx = Math.abs(a.vx);
    if (a.x + a.width >= canvas.width - screenPadding) a.vx = -Math.abs(a.vx);
    if (a.y <= screenPadding) a.vy = Math.abs(a.vy);
    if (a.y + a.height >= canvas.height / 2 - screenPadding)
      a.vy = -Math.abs(a.vy);

    for (let j = i + 1; j < menuTargets.length; j++) {
      const b = menuTargets[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      const minDist = (a.width + b.width) / 2 + targetPadding;

      if (distance < minDist) {
        const angle = Math.atan2(dy, dx);
        const overlap = (minDist - distance) / 2;
        a.x -= Math.cos(angle) * overlap;
        a.y -= Math.sin(angle) * overlap;
        b.x += Math.cos(angle) * overlap;
        b.y += Math.sin(angle) * overlap;

        // Swap velocities for bounce effect
        [a.vx, b.vx] = [b.vx, a.vx];
        [a.vy, b.vy] = [b.vy, a.vy];
      }
    }
  }
}

// Polyfill for roundRect if needed
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isMouseDown && pullStrength < MAX_PULL) {
    pullStrength += 2;
  }

  drawBow();
  drawMenuTargets();

  arrows.forEach((arrow, i) => {
    arrow.x += Math.cos(arrow.angle) * arrow.speed;
    arrow.y += Math.sin(arrow.angle) * arrow.speed;
    drawArrow(arrow);

    let hitSomething = false;

    const hitTarget = menuTargets.find((t) => checkCollision(arrow, t));
    if (hitTarget) {
      hitSomething = true;
      triggerExplosion(arrow.x, arrow.y);
      drawBullseye(arrow.x, arrow.y, arrow.strength);
      animateTargetHit(hitTarget);

      // ✅ New full-screen glowing goal message
      const goalMsg = document.createElement("div");
      goalMsg.className = "goal-hit-message";
      goalMsg.innerHTML = `
      Goal achieved! <br>
      <small>Start your virtual tour and experience your university</small>
    `;
      document.body.appendChild(goalMsg);

      gsap.fromTo(
        goalMsg,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1.1, duration: 0.8, ease: "back.out(1.7)" }
      );

      gsap.to(goalMsg, {
        opacity: 0,
        scale: 1.4,
        delay: 2.5,
        duration: 1,
        ease: "power2.in",
        onComplete: () => goalMsg.remove(),
      });

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = hitTarget.url;
      }, 400);

      arrows.splice(i, 1);
    }

    // If arrow leaves bounds without hitting
    if (
      !hitSomething &&
      (arrow.y < 0 || arrow.x < 0 || arrow.x > canvas.width)
    ) {
      drawMissMessage(); // plays sound + visual
      arrows.splice(i, 1);
    }
  });

  handleTargetCollisions();
  requestAnimationFrame(update);
}

// Start the game
update();

// Handle window resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  bow.x = canvas.width / 2;
  bow.y = canvas.height - 100;
});

// Prevent text selection
document.addEventListener("selectstart", function (e) {
  e.preventDefault();
});
