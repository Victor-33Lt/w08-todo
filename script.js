"use strict";

const STORAGE_KEY = "todo-list-tailwind";
const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const inputError = document.querySelector("#input-error");
const list = document.querySelector("#todo-list");
const template = document.querySelector("#todo-template");
const filters = document.querySelector("#filters");
const emptyState = document.querySelector("#empty-state");
const emptyMessage = document.querySelector("#empty-message");
const progressText = document.querySelector("#progress-text");
const progressBar = document.querySelector("#progress-bar");

let todos = loadTodos();
let currentFilter = "all";

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter((todo) =>
      todo &&
      (typeof todo.id === "string" || typeof todo.id === "number") &&
      typeof todo.text === "string" &&
      typeof todo.completed === "boolean"
    );
  } catch {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // App remains usable even when browser storage is unavailable.
  }
}

function getVisibleTodos() {
  if (currentFilter === "active") return todos.filter((todo) => !todo.completed);
  if (currentFilter === "completed") return todos.filter((todo) => todo.completed);
  return todos;
}

function render() {
  const visibleTodos = getVisibleTodos();
  list.replaceChildren();

  visibleTodos.forEach((todo) => {
    const item = template.content.firstElementChild.cloneNode(true);
    const checkbox = item.querySelector(".todo-check");
    const text = item.querySelector(".todo-text");

    item.dataset.id = String(todo.id);
    item.classList.toggle("completed", todo.completed);
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `${todo.completed ? "완료 취소" : "완료"}: ${todo.text}`);
    text.textContent = todo.text;
    item.querySelector(".delete-button").setAttribute("aria-label", `할 일 삭제: ${todo.text}`);
    list.append(item);
  });

  const completedCount = todos.filter((todo) => todo.completed).length;
  const percentage = todos.length ? Math.floor(completedCount / todos.length * 100) : 0;
  progressText.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
  progressBar.parentElement.setAttribute("aria-valuenow", String(percentage));

  emptyState.hidden = visibleTodos.length !== 0;
  if (visibleTodos.length === 0) {
    emptyMessage.textContent = todos.length
      ? "해당하는 할 일이 없습니다."
      : "등록된 할 일이 없습니다.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    inputError.hidden = false;
    input.focus();
    return;
  }

  inputError.hidden = true;
  todos.unshift({
    id: `${Date.now()}-${crypto.randomUUID?.() ?? Math.random()}`,
    text,
    completed: false
  });
  input.value = "";
  saveTodos();
  render();
  input.focus();
});

input.addEventListener("input", () => {
  if (input.value.trim()) inputError.hidden = true;
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  currentFilter = button.dataset.filter;
  filters.querySelectorAll("[data-filter]").forEach((filterButton) => {
    const active = filterButton === button;
    filterButton.classList.toggle("active", active);
    filterButton.setAttribute("aria-pressed", String(active));
  });
  render();
});

list.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".todo-check");
  if (!checkbox) return;
  const item = checkbox.closest(".todo-item");
  const todo = todos.find((entry) => entry.id === item.dataset.id);
  if (!todo) return;
  todo.completed = checkbox.checked;
  saveTodos();
  render();
});

list.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-button");
  if (!deleteButton) return;
  const item = deleteButton.closest(".todo-item");
  todos = todos.filter((todo) => todo.id !== item.dataset.id);
  saveTodos();
  render();
});

render();
