const STORAGE_KEY = "orbit-habits-v1";

const defaultHabits = [
  { id: crypto.randomUUID(), name: "Hydrate", emoji: "💧", goal: 1, count: 1 },
  { id: crypto.randomUUID(), name: "Workout", emoji: "🏋️", goal: 1, count: 0 },
  { id: crypto.randomUUID(), name: "Read", emoji: "📚", goal: 2, count: 1 }
];

const form = document.querySelector("#habit-form");
const nameInput = document.querySelector("#habit-name");
const emojiInput = document.querySelector("#habit-emoji");
const goalInput = document.querySelector("#habit-goal");
const habitList = document.querySelector("#habit-list");
const summary = document.querySelector("#summary");
const resetButton = document.querySelector("#reset-day");

let habits = loadHabits();

function loadHabits() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultHabits);

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return structuredClone(defaultHabits);

    return parsed;
  } catch (error) {
    console.warn("Failed to parse local habits:", error);
    return structuredClone(defaultHabits);
  }
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function getCompletedCount() {
  return habits.filter((habit) => habit.count >= habit.goal).length;
}

function getTotalProgress() {
  const total = habits.reduce((sum, habit) => sum + habit.goal, 0);
  const done = habits.reduce(
    (sum, habit) => sum + Math.min(habit.count, habit.goal),
    0
  );

  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function renderSummary() {
  const totalHabits = habits.length;
  const completed = getCompletedCount();
  const progress = getTotalProgress();

  summary.innerHTML = `
    <div class="summary-card">
      <span class="label">Habits</span>
      <span class="value">${totalHabits}</span>
    </div>
    <div class="summary-card">
      <span class="label">Completed</span>
      <span class="value">${completed}</span>
    </div>
    <div class="summary-card">
      <span class="label">Progress</span>
      <span class="value">${progress}%</span>
    </div>
  `;
}

function renderHabits() {
  if (!habits.length) {
    habitList.innerHTML =
      '<p class="empty-state">No habits yet. Add one to begin your orbit.</p>';
    return;
  }

  habitList.innerHTML = habits
    .map((habit) => {
      const pct = Math.min((habit.count / habit.goal) * 100, 100);
      const complete = habit.count >= habit.goal;

      return `
        <article class="habit-item ${complete ? "complete" : ""}">
          <div class="habit-emoji" aria-hidden="true">${habit.emoji || "✨"}</div>

          <div class="habit-main">
            <h4>${habit.name}</h4>
            <div class="progress-meta">
              <span>${habit.count}/${habit.goal}</span>
              <span>•</span>
              <span>${complete ? "Goal reached" : "Keep going"}</span>
            </div>
            <div class="progress-bar" aria-label="${habit.name} progress">
              <span style="width: ${pct}%"></span>
            </div>
          </div>

          <div class="habit-actions">
            <button class="habit-action small" data-action="decrement" data-id="${habit.id}" type="button">−1</button>
            <button class="habit-action" data-action="increment" data-id="${habit.id}" type="button">+1</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function addHabit(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const emoji = emojiInput.value.trim() || "✨";
  const goal = Number(goalInput.value || 1);

  if (!name) return;

  habits.push({
    id: crypto.randomUUID(),
    name,
    emoji,
    goal: Math.min(Math.max(goal, 1), 12),
    count: 0
  });

  saveHabits();
  render();
  form.reset();
  emojiInput.value = "✨";
  goalInput.value = 1;
  nameInput.focus();
}

function changeCount(id, delta) {
  habits = habits.map((habit) => {
    if (habit.id !== id) return habit;

    return {
      ...habit,
      count: Math.max(0, habit.count + delta)
    };
  });

  saveHabits();
  render();
}

function resetDay() {
  habits = habits.map((habit) => ({ ...habit, count: 0 }));
  saveHabits();
  render();
}

function handleHabitListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "increment") changeCount(id, 1);
  if (action === "decrement") changeCount(id, -1);
}

form.addEventListener("submit", addHabit);
resetButton.addEventListener("click", resetDay);
habitList.addEventListener("click", handleHabitListClick);

function render() {
  renderSummary();
  renderHabits();
}

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((error) => console.warn("Service worker registration failed:", error));
  });
}