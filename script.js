// script.js

// STARFIELD

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

for (let i = 0; i < 300; i++) {
  stars.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.5,
    opacity: Math.random(),
    velocity: Math.random() * 0.2
  });
}

function animateStars() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => {

    star.y += star.velocity;

    if (star.y > window.innerHeight) {
      star.y = 0;
    }

    star.opacity += (Math.random() - 0.5) * 0.02;

    if (star.opacity < 0.2) star.opacity = 0.2;
    if (star.opacity > 1) star.opacity = 1;

    ctx.beginPath();

    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

    ctx.fillStyle =
      `rgba(255,255,255,${star.opacity})`;

    ctx.fill();
  });

  requestAnimationFrame(animateStars);
}

animateStars();

// HERO PARALLAX

document.addEventListener("mousemove", (e) => {

  const gradient =
    document.querySelector(".hero-gradient");

  const x =
    (e.clientX / window.innerWidth - 0.5) * 50;

  const y =
    (e.clientY / window.innerHeight - 0.5) * 50;

  gradient.style.transform =
    `translate(${x}px, ${y}px)`;
});

// HERO ANIMATION

anime.timeline({
  easing: "easeOutExpo"
})

.add({
  targets: ".hero-eyebrow",
  opacity: [0,1],
  translateY: [20,0],
  duration: 1000
})

.add({
  targets: ".hero-title",
  opacity: [0,1],
  translateY: [80,0],
  duration: 1400
}, "-=700")

.add({
  targets: ".hero-description",
  opacity: [0,1],
  translateY: [40,0],
  duration: 1000
}, "-=1000")

.add({
  targets: ".hero-buttons a",
  opacity: [0,1],
  translateY: [20,0],
  delay: anime.stagger(120),
  duration: 1000
}, "-=700")

.add({
  targets: ".scroll-indicator",
  opacity: [0,1],
  duration: 1000
}, "-=600");

// SECTION REVEALS

const observer =
new IntersectionObserver((entries) => {

  entries.forEach(entry => {

    if (entry.isIntersecting) {

      anime({
        targets: entry.target,
        opacity: [0,1],
        translateY: [60,0],
        duration: 1200,
        easing: "easeOutExpo"
      });

      observer.unobserve(entry.target);
    }
  });

}, {
  threshold: 0.15
});

document
.querySelectorAll(".glass-card, .section-header")
.forEach(el => observer.observe(el));

// MAGNETIC BUTTON EFFECT

document
.querySelectorAll(".primary-btn, .secondary-btn")
.forEach(button => {

  button.addEventListener("mousemove", (e) => {

    const rect = button.getBoundingClientRect();

    const x =
      e.clientX - rect.left - rect.width / 2;

    const y =
      e.clientY - rect.top - rect.height / 2;

    button.style.transform =
      `translate(${x * 0.08}px, ${y * 0.08}px)`;
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "";
  });
});