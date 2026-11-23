"use strict";

const player = document.getElementById("track");
const spectrum = document.getElementById("spectrum");
const toggle = document.getElementById("audio-toggle");
const audioStatus = document.getElementById("audio-status");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const paint = spectrum.getContext("2d");
let sound;
let analyser;
let frequencies;
let frame = 0;
let levels = [];

function drawSpectrum() {
  frame = 0;
  if (player.paused || motionPreference.matches || !analyser || sound.state !== "running") return;
  const width = spectrum.clientWidth;
  const height = spectrum.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  if (spectrum.width !== Math.round(width * ratio) || spectrum.height !== Math.round(height * ratio)) {
    spectrum.width = Math.round(width * ratio);
    spectrum.height = Math.round(height * ratio);
  }
  paint.setTransform(ratio, 0, 0, ratio, 0, 0);
  paint.clearRect(0, 0, width, height);
  analyser.getByteFrequencyData(frequencies);
  const gutter = Math.min(78, Math.max(14, (width - 1248) / 2 - 3), width * .08);
  const rows = Math.max(12, Math.floor(height / 20));
  const stride = height / rows;
  const segment = gutter < 22 ? 4 : 6;
  const segments = Math.max(1, Math.floor(gutter / segment));
  const gradient = paint.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, "#6333a6");
  gradient.addColorStop(1, "#e6afff");
  paint.fillStyle = gradient;
  for (let row = 0; row < rows; row++) {
    for (let side = 0; side < 2; side++) {
      const channel = row + side * rows;
      const position = (rows - row - 1) / rows;
      const start = Math.floor((3 + side * 3) * 27 ** position);
      const end = Math.max(start + 1, Math.ceil((3 + side * 3) * 27 ** (position + 1 / rows)));
      let signal = 0;
      for (let bin = start; bin < end; bin++) signal = Math.max(signal, frequencies[bin]);
      levels[channel] = Math.max(signal, (levels[channel] ?? 0) * .88);
      const blocks = Math.round((levels[channel] / 255) ** 1.35 * segments);
      for (let block = 0; block < Math.max(1, blocks); block++) {
        paint.globalAlpha = block < blocks ? 1 : .18;
        const x = side ? width - (block + 1) * segment + 1 : block * segment;
        paint.fillRect(Math.round(x), Math.round(row * stride), segment - 1, Math.max(2, stride - 3));
      }
    }
  }
  paint.globalAlpha = 1;
  frame = requestAnimationFrame(drawSpectrum);
}

function clearSpectrum() {
  cancelAnimationFrame(frame);
  frame = 0;
  levels = [];
  paint?.clearRect(0, 0, spectrum.width, spectrum.height);
}

function syncSpectrum() {
  if (player.paused || motionPreference.matches) clearSpectrum();
  else if (!frame) drawSpectrum();
}

function updateToggle(playing) {
  const label = (playing ? "Pause" : "Play") + " After Class FM";
  toggle.classList.toggle("is-playing", playing);
  toggle.setAttribute("aria-label", label);
  toggle.title = label;
}

player.addEventListener("play", async () => {
  audioStatus.textContent = "";
  updateToggle(true);
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine || !paint) return;
  try {
    if (!sound) {
      sound = new AudioEngine();
      analyser = sound.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = .78;
      frequencies = new Uint8Array(analyser.frequencyBinCount);
      sound.createMediaElementSource(player).connect(analyser).connect(sound.destination);
    }
    await sound.resume();
    syncSpectrum();
  } catch {
    audioStatus.textContent = "The visualizer is unavailable in this browser.";
  }
});
player.addEventListener("pause", () => {
  updateToggle(false);
  clearSpectrum();
});
player.addEventListener("error", () => {
  updateToggle(false);
  clearSpectrum();
  audioStatus.textContent = "The audio track could not load. Reload the page to try again.";
});
motionPreference.addEventListener("change", syncSpectrum);

toggle.addEventListener("click", () => {
  if (player.paused) {
    player.play().catch(() => {
      audioStatus.textContent = "Audio could not start. Try again.";
    });
  } else {
    player.pause();
  }
});
player.volume = .38;
player.play().catch(() => updateToggle(false));
