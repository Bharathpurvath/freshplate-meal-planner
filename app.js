const STORAGE_KEY = "freshplate.kitchen.v1";

const recipes = [
  { id:"chickpea-bowl", title:"Chickpea & spinach bowl", emoji:"🥗", tone:"green", time:20, tags:["Easy","Plant-forward"], description:"Warm chickpeas, tender greens, and bright tomato with a squeeze of lemon. A flexible lunch that starts with pantry staples.", ingredients:["Chickpeas","Baby spinach","Cherry tomatoes","Lemon","Red onion"],steps:["Warm the chickpeas in a pan with a small splash of water and your favorite seasoning.","Fold in the spinach and cook just until it softens.","Serve with chopped tomatoes, onion, and a squeeze of lemon."] },
  { id:"tomato-egg-toast", title:"Tomato & egg toast", emoji:"🍳", tone:"warm", time:15, tags:["Quick","Breakfast"], description:"A quick skillet of soft eggs and warm tomatoes, piled over crisp toast with a handful of greens.", ingredients:["Eggs","Bread","Cherry tomatoes","Baby spinach"],steps:["Toast the bread while you prepare the topping.","Warm the tomatoes in a pan until they begin to soften, then add beaten eggs and stir gently.","Fold in the spinach until just wilted, then spoon over the toast."] },
  { id:"apple-yogurt-oats", title:"Apple yogurt oats", emoji:"🍎", tone:"cool", time:10, tags:["No-cook","Breakfast"], description:"Cool yogurt, rolled oats, and crisp apple make an easy breakfast you can prep the night before.", ingredients:["Apples","Greek yogurt","Oats","Honey"],steps:["Stir the oats and yogurt together with a splash of milk or water.","Slice the apple and add it on top.","Finish with honey to taste. Chill overnight if you prefer a softer texture."] },
  { id:"lemon-rice-bowl", title:"Lemony rice bowl", emoji:"🍚", tone:"green", time:25, tags:["One-pot","Vegetarian"], description:"A bright, comforting bowl with fluffy rice, sweet carrot, and lemon. Add whatever vegetables need using.", ingredients:["Basmati rice","Carrots","Peas","Lemon"],steps:["Rinse the rice and cook it using the package directions.","Steam or sauté the carrots and peas until tender.","Combine with the rice and finish with lemon juice."] },
  { id:"garlic-lentils", title:"Quick garlic lentils", emoji:"🍲", tone:"warm", time:30, tags:["Comfort food","Plant-forward"], description:"A simple, gently spiced lentil pot with garlic, onion, and carrot. Serve with rice or toast.", ingredients:["Red lentils","Carrots","Red onion","Garlic"],steps:["Rinse the lentils. Soften the onion and garlic in a little oil or water.","Add diced carrots, lentils, and enough water to cover; simmer until tender, following the lentil package timing.","Taste and season, then serve on its own or with rice or toast."] },
  { id:"garden-toast", title:"Garden toast plate", emoji:"🥪", tone:"cool", time:12, tags:["Quick","Lunch"], description:"Toast topped with a soft egg, greens, and juicy tomatoes. Simple ingredients, plenty of room to improvise.", ingredients:["Bread","Eggs","Baby spinach","Cherry tomatoes"],steps:["Toast the bread and set it aside.","Cook the eggs to your liking and warm the tomatoes in the same pan.","Add the spinach for the final minute, then serve everything over toast."] }
];

const categoryIcons = {
  "Produce":"🥬",
  "Dairy & eggs":"🥛",
  "Grains & pantry":"🌾",
  "Protein":"🫘",
  "Other":"🧺"
};

let activeCategory = "All";
let activeRecipeId = null;
let toastTimer;

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function dateOffset(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function makeId() {
  return String(Date.now()) + "-" + Math.random().toString(16).slice(2, 7);
}

function starterPantry() {
  return [
    {id:makeId(),name:"Baby spinach",quantity:1,unit:"bunch",category:"Produce",expiresAt:dateOffset(1)},
    {id:makeId(),name:"Greek yogurt",quantity:1,unit:"pack",category:"Dairy & eggs",expiresAt:dateOffset(2)},
    {id:makeId(),name:"Cherry tomatoes",quantity:1,unit:"pack",category:"Produce",expiresAt:dateOffset(3)},
    {id:makeId(),name:"Bread",quantity:1,unit:"pack",category:"Grains & pantry",expiresAt:dateOffset(1)},
    {id:makeId(),name:"Eggs",quantity:6,unit:"piece",category:"Dairy & eggs",expiresAt:dateOffset(7)},
    {id:makeId(),name:"Chickpeas",quantity:2,unit:"can",category:"Protein",expiresAt:dateOffset(60)},
    {id:makeId(),name:"Red onion",quantity:2,unit:"piece",category:"Produce",expiresAt:dateOffset(14)},
    {id:makeId(),name:"Lemon",quantity:3,unit:"piece",category:"Produce",expiresAt:dateOffset(10)},
    {id:makeId(),name:"Basmati rice",quantity:1,unit:"kg",category:"Grains & pantry",expiresAt:dateOffset(120)},
    {id:makeId(),name:"Apples",quantity:4,unit:"piece",category:"Produce",expiresAt:dateOffset(5)},
    {id:makeId(),name:"Oats",quantity:1,unit:"pack",category:"Grains & pantry",expiresAt:dateOffset(120)},
    {id:makeId(),name:"Carrots",quantity:4,unit:"piece",category:"Produce",expiresAt:dateOffset(8)},
    {id:makeId(),name:"Garlic",quantity:1,unit:"piece",category:"Produce",expiresAt:dateOffset(45)}
  ];
}

function readData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Array.isArray(saved.pantry) && Array.isArray(saved.shopping)) {
      return { pantry:saved.pantry, shopping:saved.shopping, mealPlan:saved.mealPlan || {} };
    }
  } catch (error) {}
  return { pantry:starterPantry(), shopping:[], mealPlan:{} };
}

const state = readData();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({pantry:state.pantry,shopping:state.shopping,mealPlan:state.mealPlan}));
  } catch (error) {
    showToast("This browser could not save your kitchen list.");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[character]);
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function findRecipe(id) {
  return recipes.find((recipe) => recipe.id === id);
}

function hasIngredient(name) {
  const match = normalize(name);
  return state.pantry.some((item) => normalize(item.name) === match && Number(item.quantity) > 0);
}

function recipeAvailability(recipe) {
  const missing = recipe.ingredients.filter((ingredient) => !hasIngredient(ingredient));
  const available = recipe.ingredients.length - missing.length;
  return {missing,available,percent:Math.round((available / recipe.ingredients.length) * 100)};
}

function rankedRecipes() {
  return [...recipes].sort((a,b) => {
    const score = recipeAvailability(b).percent - recipeAvailability(a).percent;
    return score || a.time - b.time;
  });
}

function dayDifference(dateKey) {
  if (!dateKey) return null;
  const today = new Date();
  today.setHours(12,0,0,0);
  const target = new Date(dateKey + "T12:00:00");
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target - today) / 86400000);
}

function expiryText(dateKey) {
  const difference = dayDifference(dateKey);
  if (difference === null) return "No date";
  if (difference < 0) return "Past date";
  if (difference === 0) return "Use today";
  if (difference === 1) return "Use tomorrow";
  if (difference <= 3) return "Use in " + difference + " days";
  return "Best before " + new Date(dateKey + "T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
}

function expiryClass(dateKey) {
  const difference = dayDifference(dateKey);
  if (difference === null || difference > 3) return "fresh";
  if (difference < 0) return "past";
  return "";
}

function foodEmoji(item) {
  const text = normalize(item.name);
  if (/spinach|lettuce|greens|broccoli|kale/.test(text)) return "🥬";
  if (/tomato/.test(text)) return "🍅";
  if (/apple/.test(text)) return "🍎";
  if (/bread|toast/.test(text)) return "🍞";
  if (/egg/.test(text)) return "🥚";
  if (/yogurt|milk|cheese/.test(text)) return "🥛";
  if (/lemon|lime/.test(text)) return "🍋";
  if (/rice|oat|flour|grain/.test(text)) return "🌾";
  if (/carrot/.test(text)) return "🥕";
  if (/chickpea|lentil|bean/.test(text)) return "🫘";
  if (/onion|garlic/.test(text)) return "🧅";
  if (/pea/.test(text)) return "🫛";
  return categoryIcons[item.category] || "🧺";
}

function prettyQuantity(quantity) {
  const value = Number(quantity);
  return Number.isInteger(value) ? String(value) : String(value.toFixed(1)).replace(/\.0$/,"");
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"),2200);
}

function setView(view) {
  document.querySelectorAll(".app-view").forEach((section) => {
    const visible = section.dataset.view === view;
    section.hidden = !visible;
    section.classList.toggle("is-visible",visible);
  });
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("is-active",button.dataset.viewTarget === view);
    button.setAttribute("aria-current",button.dataset.viewTarget === view ? "page" : "false");
  });
  window.scrollTo({top:0,behavior:"smooth"});
  if (view === "pantry") renderPantry();
  if (view === "planner") renderPlanner();
  if (view === "shopping") renderShopping();
}

function renderHeader() {
  const now = new Date();
  document.querySelector("#todayDate").textContent = now.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
}

function renderOverview() {
  const currentWeek = getWeekDates().map((date) => date.key);
  const plannedCount = currentWeek.filter((date) => state.mealPlan[date]).length;
  const expiringCount = state.pantry.filter((item) => {
    const difference = dayDifference(item.expiresAt);
    return difference !== null && difference >= 0 && difference <= 3;
  }).length;
  document.querySelector("#pantryStat").textContent = state.pantry.length + (state.pantry.length === 1 ? " item" : " items");
  document.querySelector("#expiringStat").textContent = expiringCount + (expiringCount === 1 ? " item" : " items");
  document.querySelector("#plannedStat").textContent = plannedCount + (plannedCount === 1 ? " this week" : " this week");
  document.querySelector("#pantryNavCount").textContent = state.pantry.length;
  document.querySelector("#shoppingNavCount").textContent = state.shopping.filter((item) => !item.done).length;
  renderExpiring();
  renderTodayPick();
  renderRecipeCards("#recipeSuggestions",rankedRecipes().slice(0,3));
}

function renderExpiring() {
  const list = document.querySelector("#expiringList");
  const empty = document.querySelector("#expiringEmpty");
  const items = state.pantry
    .filter((item) => {
      const difference = dayDifference(item.expiresAt);
      return difference !== null && difference <= 3;
    })
    .sort((a,b) => (dayDifference(a.expiresAt) ?? 999) - (dayDifference(b.expiresAt) ?? 999))
    .slice(0,4);
  list.replaceChildren();
  empty.hidden = items.length > 0;
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "expiring-item";
    const difference = dayDifference(item.expiresAt);
    const tagClass = difference < 0 ? "past" : "";
    row.innerHTML = '<span class="food-dot">' + foodEmoji(item) + '</span><span><span class="expiring-name">' + escapeHtml(item.name) + '</span><small class="expiring-detail">' + escapeHtml(prettyQuantity(item.quantity) + " " + item.unit) + '</small></span><span class="expiry-tag ' + tagClass + '">' + escapeHtml(expiryText(item.expiresAt)) + '</span>';
    list.append(row);
  });
}

function renderTodayPick() {
  const container = document.querySelector("#todayPick");
  const plannedId = state.mealPlan[localDateKey()];
  const recipe = findRecipe(plannedId) || rankedRecipes()[0];
  if (!recipe) {
    container.innerHTML = '<div class="empty-inline"><span>🥗</span><p>Add ingredients to find a meal idea.</p></div>';
    return;
  }
  const availability = recipeAvailability(recipe);
  const plannedLabel = plannedId ? "TODAY'S PLAN" : availability.percent + "% MATCHES YOUR PANTRY";
  container.innerHTML = '<div class="today-recipe"><div class="today-recipe-top"><div class="food-art">' + recipe.emoji + '</div><div><p class="section-label">' + plannedLabel + '</p><h3>' + escapeHtml(recipe.title) + '</h3><p class="recipe-meta">' + recipe.time + ' min · ' + escapeHtml(recipe.tags[0]) + '</p></div></div><div class="today-recipe-actions"><button class="button button-outline" type="button" data-open-recipe="' + recipe.id + '">See ingredients</button><button class="button button-primary" type="button" data-plan-today="' + recipe.id + '">' + (plannedId ? "Update today's plan" : "Plan this meal") + '</button></div></div>';
}

function renderRecipeCards(selector, collection) {
  const target = document.querySelector(selector);
  target.replaceChildren();
  collection.forEach((recipe) => {
    const availability = recipeAvailability(recipe);
    const card = document.createElement("article");
    card.className = "recipe-card";
    const tone = recipe.tone === "warm" ? "warm" : recipe.tone === "cool" ? "cool" : "";
    card.innerHTML = '<div class="recipe-art" data-tone="' + tone + '" aria-hidden="true">' + recipe.emoji + '<span class="match-pill">' + availability.percent + '% match</span></div><div class="recipe-card-body"><h3>' + escapeHtml(recipe.title) + '</h3><div class="recipe-card-meta"><span>' + recipe.time + ' min · ' + escapeHtml(recipe.tags[0]) + '</span><span>' + availability.available + '/' + recipe.ingredients.length + ' items</span></div><div class="recipe-card-actions"><button type="button" data-open-recipe="' + recipe.id + '">Quick look ↗</button><button type="button" data-plan-today="' + recipe.id + '">Plan today ＋</button></div></div>';
    target.append(card);
  });
}

function renderPantry() {
  const list = document.querySelector("#pantryList");
  const search = normalize(document.querySelector("#pantrySearch").value);
  const visibleItems = state.pantry
    .filter((item) => activeCategory === "All" || item.category === activeCategory)
    .filter((item) => !search || normalize(item.name).includes(search))
    .sort((a,b) => (a.expiresAt || "9999").localeCompare(b.expiresAt || "9999"));
  document.querySelector("#pantryHeadingCount").textContent = state.pantry.length;
  document.querySelector("#pantryNavCount").textContent = state.pantry.length;
  document.querySelector("#pantryEmpty").hidden = state.pantry.length > 0;
  list.replaceChildren();
  visibleItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "pantry-row";
    row.innerHTML = '<span class="pantry-emoji">' + foodEmoji(item) + '</span><span><span class="pantry-item-name">' + escapeHtml(item.name) + '</span><small class="pantry-item-meta">' + escapeHtml(item.category) + '</small></span><span class="pantry-quantity">' + escapeHtml(prettyQuantity(item.quantity) + " " + item.unit) + '</span><span class="pantry-expiry">' + escapeHtml(expiryText(item.expiresAt)) + '</span><span class="row-actions"><button class="icon-button" type="button" data-use-item="' + item.id + '" aria-label="Use one ' + escapeHtml(item.name) + '" title="Use one">−</button><button class="icon-button delete" type="button" data-delete-item="' + item.id + '" aria-label="Remove ' + escapeHtml(item.name) + '" title="Remove">×</button></span>';
    list.append(row);
  });
  document.querySelector("#pantryEmpty").hidden = state.pantry.length > 0 || visibleItems.length > 0;
  if (visibleItems.length === 0 && state.pantry.length > 0) {
    const noResults = document.createElement("div");
    noResults.className = "empty-inline";
    noResults.innerHTML = "<p>No ingredients match that search.</p>";
    list.append(noResults);
  }
}

function addPantryItem(form) {
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const quantity = Number(formData.get("quantity"));
  if (!name || !Number.isFinite(quantity) || quantity <= 0) {
    showToast("Add an ingredient and a quantity first.");
    return;
  }
  const item = {
    id:makeId(),
    name,
    quantity,
    unit:String(formData.get("unit") || "piece"),
    category:String(formData.get("category") || "Other"),
    expiresAt:String(formData.get("expiresAt") || "")
  };
  state.pantry.unshift(item);
  persist();
  form.reset();
  renderAll();
  showToast(name + " added to your pantry.");
}

function removePantryItem(id) {
  const item = state.pantry.find((entry) => entry.id === id);
  if (!item) return;
  state.pantry = state.pantry.filter((entry) => entry.id !== id);
  persist();
  renderAll();
  showToast(item.name + " removed from your pantry.");
}

function usePantryItem(id) {
  const item = state.pantry.find((entry) => entry.id === id);
  if (!item) return;
  if (Number(item.quantity) <= 1) {
    removePantryItem(id);
    return;
  }
  item.quantity = Math.max(0,Number(item.quantity) - 1);
  persist();
  renderAll();
  showToast("Updated " + item.name + ".");
}

function getWeekDates() {
  const today = new Date();
  today.setHours(12,0,0,0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({length:7},(_,index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {key:localDateKey(date),date};
  });
}

function renderPlanner() {
  const grid = document.querySelector("#weekGrid");
  grid.replaceChildren();
  const week = getWeekDates();
  const first = week[0].date.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  const last = week[6].date.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  document.querySelector("#weekLabel").textContent = first.toUpperCase() + " — " + last.toUpperCase();
  week.forEach(({key,date}) => {
    const assignedId = state.mealPlan[key] || "";
    const assigned = findRecipe(assignedId);
    const card = document.createElement("article");
    card.className = "day-card" + (key === localDateKey() ? " is-today" : "");
    const options = recipes.map((recipe) => '<option value="' + recipe.id + '"' + (recipe.id === assignedId ? " selected" : "") + '>' + escapeHtml(recipe.title) + '</option>').join("");
    card.innerHTML = '<div class="day-heading"><span>' + date.toLocaleDateString(undefined,{weekday:"short"}).toUpperCase() + '</span>' + (key === localDateKey() ? "<span>TODAY</span>" : "") + '</div><div class="day-date">' + date.toLocaleDateString(undefined,{day:"2-digit"}) + '</div>' + (assigned ? '<div class="day-meal"><span>' + assigned.emoji + '</span><span>' + escapeHtml(assigned.title) + '</span></div>' : '<div class="day-empty">Nothing planned</div>') + '<div class="day-actions"><select id="plan-select-' + key + '" aria-label="Choose a meal for ' + date.toLocaleDateString(undefined,{weekday:"long"}) + '"><option value="">Choose a meal…</option>' + options + '</select><button type="button" data-save-plan="' + key + '" aria-label="Save meal for ' + date.toLocaleDateString(undefined,{weekday:"long"}) + '" title="Add to plan">＋</button>' + (assigned ? '<button type="button" class="grocery-day-button" data-grocery-date="' + key + '" aria-label="Add missing ingredients for ' + escapeHtml(assigned.title) + '" title="Add missing ingredients">🛒</button>' : "") + '</div>';
    grid.append(card);
  });
  renderRecipeCards("#plannerRecipes",rankedRecipes());
}

function savePlan(dateKey) {
  const select = document.querySelector("#plan-select-" + dateKey);
  if (!select || !select.value) {
    showToast("Choose a recipe for that day first.");
    return;
  }
  state.mealPlan[dateKey] = select.value;
  persist();
  renderAll();
  renderPlanner();
  showToast("Meal added to your week.");
}

function addToToday(recipeId) {
  const recipe = findRecipe(recipeId);
  if (!recipe) return;
  state.mealPlan[localDateKey()] = recipe.id;
  persist();
  renderAll();
  showToast(recipe.title + " added to today's plan.");
}

function categoryForIngredient(name) {
  const value = normalize(name);
  if (/yogurt|milk|cheese|egg|butter/.test(value)) return "Dairy & eggs";
  if (/rice|oat|bread|flour|pasta|honey/.test(value)) return "Grains & pantry";
  if (/lentil|chickpea|bean|tofu/.test(value)) return "Protein";
  if (/spinach|tomato|onion|lemon|carrot|pea|apple|garlic/.test(value)) return "Produce";
  return "Other";
}

function addShoppingItems(names, source) {
  const additions = [];
  names.forEach((name) => {
    const alreadyListed = state.shopping.some((item) => !item.done && normalize(item.name) === normalize(name));
    if (alreadyListed) return;
    const item = {id:makeId(),name,category:categoryForIngredient(name),done:false,source:source || "Added by you"};
    state.shopping.push(item);
    additions.push(name);
  });
  if (additions.length === 0) {
    showToast("Those items are already on your list.");
    return;
  }
  persist();
  renderAll();
  showToast(additions.length + (additions.length === 1 ? " item added" : " items added") + " to your grocery list.");
}

function addRecipeMissing(recipeId) {
  const recipe = findRecipe(recipeId);
  if (!recipe) return;
  const missing = recipeAvailability(recipe).missing;
  if (missing.length === 0) {
    showToast("You already have everything for this recipe.");
    return;
  }
  addShoppingItems(missing,recipe.title);
}

function renderShopping() {
  const groups = document.querySelector("#shoppingGroups");
  const empty = document.querySelector("#shoppingEmpty");
  groups.replaceChildren();
  const remaining = state.shopping.filter((item) => !item.done).length;
  document.querySelector("#shoppingProgress").textContent = remaining + (remaining === 1 ? " left" : " left");
  document.querySelector("#shoppingNavCount").textContent = remaining;
  empty.hidden = state.shopping.length > 0;
  const categories = ["Produce","Dairy & eggs","Grains & pantry","Protein","Other"];
  categories.forEach((category) => {
    const items = state.shopping.filter((item) => item.category === category);
    if (items.length === 0) return;
    const section = document.createElement("section");
    section.className = "shopping-group";
    const title = document.createElement("h3");
    title.className = "shopping-group-title";
    title.innerHTML = "<span>" + (categoryIcons[category] || "🧺") + "</span>" + escapeHtml(category.toUpperCase());
    section.append(title);
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "shopping-row" + (item.done ? " is-done" : "");
      row.innerHTML = '<input type="checkbox" data-toggle-shopping="' + item.id + '" ' + (item.done ? "checked" : "") + ' aria-label="Mark ' + escapeHtml(item.name) + ' as ' + (item.done ? "needed" : "picked up") + '"><span class="shopping-row-name">' + escapeHtml(item.name) + (item.source && item.source !== "Added by you" ? '<small class="shopping-source">for ' + escapeHtml(item.source) + '</small>' : "") + '</span><button class="icon-button delete" type="button" data-delete-shopping="' + item.id + '" aria-label="Remove ' + escapeHtml(item.name) + '">×</button>';
      section.append(row);
    });
    groups.append(section);
  });
}

function addManualShoppingItem(form) {
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  if (!name) return;
  addShoppingItems([name],"Added by you");
  form.reset();
}

function toggleShoppingItem(id) {
  const item = state.shopping.find((entry) => entry.id === id);
  if (!item) return;
  item.done = !item.done;
  persist();
  renderShopping();
  document.querySelector("#shoppingNavCount").textContent = state.shopping.filter((entry) => !entry.done).length;
}

function removeShoppingItem(id) {
  state.shopping = state.shopping.filter((entry) => entry.id !== id);
  persist();
  renderShopping();
  document.querySelector("#shoppingNavCount").textContent = state.shopping.filter((entry) => !entry.done).length;
  showToast("Item removed from your list.");
}

function openRecipe(recipeId) {
  const recipe = findRecipe(recipeId);
  if (!recipe) return;
  activeRecipeId = recipeId;
  const availability = recipeAvailability(recipe);
  document.querySelector("#dialogVisual").textContent = recipe.emoji;
  document.querySelector("#dialogMeta").textContent = recipe.time + " MINUTES  ·  " + recipe.tags.join(" / ").toUpperCase();
  document.querySelector("#dialogTitle").textContent = recipe.title;
  document.querySelector("#dialogDescription").textContent = recipe.description;
  const ingredients = document.querySelector("#dialogIngredients");
  ingredients.replaceChildren();
  recipe.ingredients.forEach((name) => {
    const pill = document.createElement("span");
    pill.className = "ingredient-pill" + (hasIngredient(name) ? " is-owned" : "");
    pill.textContent = (hasIngredient(name) ? "✓ " : "+ ") + name;
    ingredients.append(pill);
  });
  document.querySelector("#dialogMethod").innerHTML = "<p class='section-label'>SIMPLE METHOD</p><ol>" + recipe.steps.map((step) => "<li>" + escapeHtml(step) + "</li>").join("") + "</ol>";
  document.querySelector("#dialogShopButton").textContent = availability.missing.length ? "Add " + availability.missing.length + " missing items" : "You have everything";
  document.querySelector("#dialogShopButton").disabled = availability.missing.length === 0;
  document.querySelector("#recipeDialog").showModal();
}

function closeRecipe() {
  const dialog = document.querySelector("#recipeDialog");
  if (dialog.open) dialog.close();
}

function renderAll() {
  renderHeader();
  renderOverview();
  if (document.querySelector("#view-pantry").classList.contains("is-visible")) renderPantry();
  if (document.querySelector("#view-planner").classList.contains("is-visible")) renderPlanner();
  if (document.querySelector("#view-shopping").classList.contains("is-visible")) renderShopping();
}

document.addEventListener("click",(event) => {
  const viewButton = event.target.closest("[data-view-target]");
  if (viewButton) {
    setView(viewButton.dataset.viewTarget);
    return;
  }
  const deleteItem = event.target.closest("[data-delete-item]");
  if (deleteItem) { removePantryItem(deleteItem.dataset.deleteItem); return; }
  const useItem = event.target.closest("[data-use-item]");
  if (useItem) { usePantryItem(useItem.dataset.useItem); return; }
  const openButton = event.target.closest("[data-open-recipe]");
  if (openButton) { openRecipe(openButton.dataset.openRecipe); return; }
  const planButton = event.target.closest("[data-plan-today]");
  if (planButton) { addToToday(planButton.dataset.planToday); return; }
  const saveButton = event.target.closest("[data-save-plan]");
  if (saveButton) { savePlan(saveButton.dataset.savePlan); return; }
  const groceryButton = event.target.closest("[data-grocery-date]");
  if (groceryButton) {
    const recipe = findRecipe(state.mealPlan[groceryButton.dataset.groceryDate]);
    if (recipe) addRecipeMissing(recipe.id);
    return;
  }
  const removeShopping = event.target.closest("[data-delete-shopping]");
  if (removeShopping) { removeShoppingItem(removeShopping.dataset.deleteShopping); return; }
  const categoryFilter = event.target.closest("[data-category-filter]");
  if (categoryFilter) {
    activeCategory = categoryFilter.dataset.categoryFilter;
    document.querySelectorAll("[data-category-filter]").forEach((button) => button.classList.toggle("is-selected",button === categoryFilter));
    renderPantry();
  }
});

document.querySelector("#pantryForm").addEventListener("submit",(event) => {
  event.preventDefault();
  addPantryItem(event.currentTarget);
});
document.querySelector("#shoppingForm").addEventListener("submit",(event) => {
  event.preventDefault();
  addManualShoppingItem(event.currentTarget);
});
document.querySelector("#pantrySearch").addEventListener("input",renderPantry);
document.querySelector("#shoppingGroups").addEventListener("change",(event) => {
  const input = event.target.closest("[data-toggle-shopping]");
  if (input) toggleShoppingItem(input.dataset.toggleShopping);
});
document.querySelector("#dialogClose").addEventListener("click",closeRecipe);
document.querySelector("#dialogPlanButton").addEventListener("click",() => {
  if (!activeRecipeId) return;
  addToToday(activeRecipeId);
  closeRecipe();
});
document.querySelector("#dialogShopButton").addEventListener("click",() => {
  if (!activeRecipeId) return;
  addRecipeMissing(activeRecipeId);
  closeRecipe();
});
document.querySelector("#openPantryButton").addEventListener("click",() => {
  setView("pantry");
  document.querySelector("#ingredientName").focus();
});
document.querySelector("#emptyAddButton").addEventListener("click",() => {
  document.querySelector("#ingredientName").focus();
});
document.querySelector("#recipeDialog").addEventListener("click",(event) => {
  if (event.target === event.currentTarget) closeRecipe();
});

renderAll();



