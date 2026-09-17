// This transition never requests microphone access or starts a class.
const launchButton = document.getElementById("launchTimer");
const welcomeScreen = document.getElementById("landing");
const timerScreen = document.getElementById("timerScreen");
let openingTimer = false;

function revealTimer() {
  welcomeScreen.hidden = true;
  timerScreen.hidden = false;
  window.scrollTo(0, 0);
  document.getElementById("timerTitle").focus({ preventScroll: true });
}

launchButton.addEventListener("click", async () => {
  if (openingTimer) return;
  openingTimer = true;
  launchButton.disabled = true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof launchButton.animate !== "function") {
    revealTimer();
    return;
  }

  const bounds = launchButton.getBoundingClientRect();
  const x = bounds.left + bounds.width / 2;
  const y = bounds.top + bounds.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const wipe = document.createElement("div");
  wipe.className = "launch-wipe";
  wipe.setAttribute("aria-hidden", "true");
  wipe.innerHTML = '<div class="launch-brand"><div class="launch-rings"><i></i><i></i></div><div class="launch-wave">' +
    [24, 42, 64, 84, 64, 42, 24].map(height => `<i style="height:${height}px"></i>`).join("") +
    '</div><strong>Noise Timer<span>.</span></strong><p>Make room for focus.</p></div>';
  document.body.append(wipe);
  const animations = [];
  const play = (element, frames, options) => {
    const animation = element.animate(frames, options);
    animations.push(animation);
    return animation.finished;
  };
  document.body.classList.add("launch-in-progress");
  welcomeScreen.inert = true;
  try {
    await play(launchButton, [
      { transform: "scale(1)" },
      { transform: "scale(.94)", offset: .5 },
      { transform: "scale(1)" }
    ], { duration: 160, easing: "ease-out" });
    await play(wipe, [
      { clipPath: `circle(0px at ${x}px ${y}px)` },
      { clipPath: `circle(${radius}px at ${x}px ${y}px)` }
    ], { duration: 440, easing: "cubic-bezier(.65,0,.2,1)", fill: "forwards" });
    const brand = wipe.querySelector(".launch-brand");
    await Promise.all([
      play(brand, [{ opacity: 0, transform: "translateY(14px) scale(.9)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }],
        { duration: 340, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" }),
      ...Array.from(wipe.querySelectorAll(".launch-wave i")).map((bar, index) =>
        play(bar, [{ transform: "scaleY(.35)" }, { transform: "scaleY(1.15)", offset: .45 },
          { transform: "scaleY(.55)" }, { transform: "scaleY(1)" }],
          { duration: 620, delay: index * 35, easing: "ease-in-out", fill: "both" })),
      ...Array.from(wipe.querySelectorAll(".launch-rings i")).map((ring, index) =>
        play(ring, [{ opacity: .5, transform: "scale(.6)" },
          { opacity: 0, transform: "scale(1.65)" }],
          { duration: 850, delay: index * 100, easing: "ease-out", fill: "both" }))
    ]);
    revealTimer();
    const cards = Array.from(timerScreen.children);
    await Promise.all([
      play(wipe, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.08)" }],
        { duration: 320, easing: "ease-out", fill: "forwards" }),
      ...cards.map((card, index) => play(card, [
        { opacity: 0, transform: "translateY(26px) scale(.98)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ], { duration: 480, delay: index * 65,
        easing: "cubic-bezier(.16,1,.3,1)", fill: "both" }))
    ]);
  } catch (_) {
    // Cancellation or missing animation support must never block the timer.
    revealTimer();
  } finally {
    animations.forEach(animation => animation.cancel());
    wipe.remove();
    welcomeScreen.inert = false;
    document.body.classList.remove("launch-in-progress");
  }
});
