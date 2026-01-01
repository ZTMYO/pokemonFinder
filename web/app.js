// 数据文件路径（由后端脚本预先生成）
const DATA_URL = "pokemon_data.json";

let allPokemon = [];
let filteredPokemon = [];

const colorInputsContainer = document.getElementById("color-inputs");
const addColorBtn = document.getElementById("add-color");
const clearColorsBtn = document.getElementById("clear-colors");
const runSearchBtn = document.getElementById("run-search");
const resetAllBtn = document.getElementById("reset-all");
const matchModeSelect = document.getElementById("match-mode");
const resultLimitInput = document.getElementById("result-limit");
const strictnessRange = document.getElementById("strictness");
const resultsContainer = document.getElementById("results");
const searchInput = document.getElementById("search-input");
const searchSuggestions = document.getElementById("search-suggestions");
const activeFiltersEl = document.getElementById("active-filters");

const aboutModal = document.getElementById("about-modal");
const openAboutBtn = document.getElementById("open-about");

const filterTypesContainer = document.getElementById("filter-types");
const filterGenerationSelect = document.getElementById("filter-generation");
const filterShapeSelect = document.getElementById("filter-shape");
const filterMegaCheckbox = document.getElementById("filter-mega");
const filterGmaxCheckbox = document.getElementById("filter-gmax");

const toastEl = document.getElementById("toast");

const themeToggleBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

// 当前键盘选择的搜索建议索引，-1 表示未选择
let searchActiveIndex = -1;

function showToast(message, duration = 2200) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => {
        toastEl.classList.remove("show");
    }, duration);
}

function clearSearchBox() {
    if (searchInput) searchInput.value = "";
    if (searchSuggestions) {
        searchSuggestions.innerHTML = "";
        searchSuggestions.classList.remove("visible");
    }
    searchActiveIndex = -1;
}

function runSearch() {
    if (!allPokemon.length) return;

    const colors = collectSelectedColors();
    if (!colors.length) {
        showToast("请至少选择 1 个颜色");
        return;
    }
    const filters = getCurrentFilters();
    filteredPokemon = applyFiltersToData(filters);
    activeFiltersEl.textContent = getActiveFilterSummary(filters);

    renderResults(filteredPokemon, colors, matchModeSelect.value);
}

// 属性颜色映射（仅用于筛选区的 tag 按钮）
const TYPE_COLORS = {
    "一般": "#B5B4AF",
    "格斗": "#BE4D47",
    "飞行": "#67ABEC",
    "毒": "#8943B0",
    "地面": "#9C5A59",
    "岩石": "#D3A865",
    "虫": "#9CAE1E",
    "幽灵": "#9B408E",
    "钢": "#B7C9CD",
    "火": "#E75357",
    "水": "#3F98EA",
    "草": "#80CB42",
    "电": "#F9CE40",
    "超能力": "#F8669C",
    "冰": "#64CFFC",
    "龙": "#7A5EFD",
    "恶": "#61484B",
    "妖精": "#E259E7",
};

function openModal(modal) {
    modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
    modal.setAttribute("aria-hidden", "true");
}

function setupModalDismiss(modal) {
    modal.addEventListener("click", (e) => {
        const target = e.target;
        if (target.matches("[data-dismiss]")) {
            const id = target.getAttribute("data-dismiss");
            const m = document.getElementById(id);
            if (m) closeModal(m);
        } else if (target.classList.contains("modal-backdrop")) {
            closeModal(modal);
        }
    });
}

setupModalDismiss(aboutModal);

openAboutBtn.addEventListener("click", () => openModal(aboutModal));

// 主题切换
function applyTheme(theme) {
    const body = document.body;
    if (theme === "light") {
        body.classList.add("theme-light");
        if (themeIcon) themeIcon.textContent = "☀";
    } else {
        body.classList.remove("theme-light");
        if (themeIcon) themeIcon.textContent = "☾";
    }
}

function initTheme() {
    const stored = window.localStorage.getItem("pf-theme");
    const theme = stored === "light" || stored === "dark" ? stored : "light";
    applyTheme(theme);
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        const isLight = document.body.classList.contains("theme-light");
        const next = isLight ? "dark" : "light";
        applyTheme(next);
        window.localStorage.setItem("pf-theme", next);
    });
}

initTheme();

function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null;
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function colorDistanceSq(rgb1, rgb2) {
    const dr = rgb1[0] - rgb2[0];
    const dg = rgb1[1] - rgb2[1];
    const db = rgb1[2] - rgb2[2];
    return dr * dr + dg * dg + db * db;
}

function averageRgb(colors) {
    if (!colors.length) return null;
    let r = 0, g = 0, b = 0;
    for (const c of colors) {
        r += c[0];
        g += c[1];
        b += c[2];
    }
    const n = colors.length;
    return [r / n, g / n, b / n];
}

function createColorRow(initialHex = "#000000") {
    const row = document.createElement("div");
    row.className = "color-row";

    const rowInner = document.createElement("div");
    rowInner.className = "color-input-row";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = initialHex;

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.value = initialHex;
    hexInput.className = "input color-hex";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "×";
    removeBtn.className = "ghost-button";

    colorInput.addEventListener("input", () => {
        hexInput.value = colorInput.value.toUpperCase();
    });

    function syncHexToColor() {
        let v = hexInput.value.trim();
        if (!v) return;
        if (!v.startsWith("#")) v = "#" + v;
        if (hexToRgb(v)) {
            hexInput.value = v.toUpperCase();
            colorInput.value = v;
        } else {
            showToast("请输入有效的十六进制颜色，例如 #88CC88");
            hexInput.value = colorInput.value.toUpperCase();
        }
    }

    hexInput.addEventListener("blur", () => {
        syncHexToColor();
    });

    hexInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            syncHexToColor();
        }
    });

    removeBtn.addEventListener("click", () => {
        colorInputsContainer.removeChild(row);
    });

    rowInner.appendChild(colorInput);
    rowInner.appendChild(hexInput);
    rowInner.appendChild(removeBtn);

    row.appendChild(rowInner);

    return row;
}

function ensureAtLeastOneColorRow() {
    // 不再自动添加默认颜色行，保留空状态
}

addColorBtn.addEventListener("click", () => {
    if (colorInputsContainer.children.length >= 5) {
        showToast("最多只能添加 5 个颜色");
        return;
    }
    colorInputsContainer.appendChild(createColorRow());
});

clearColorsBtn.addEventListener("click", () => {
    colorInputsContainer.innerHTML = "";
});

// 初始状态不添加任何颜色行，由用户自行点击“添加颜色”

function collectSelectedColors() {
    const hexColors = [];
    for (const row of colorInputsContainer.children) {
        const input = row.querySelector(".color-hex");
        if (!input) continue;
        let v = input.value.trim();
        if (!v) continue;
        if (!v.startsWith("#")) v = "#" + v;
        const rgb = hexToRgb(v);
        if (rgb) {
            hexColors.push({ hex: v.toUpperCase(), rgb });
        }
    }
    return hexColors;
}

function computeColorScore(pokeColorsHex, queryColors, mode) {
    if (!pokeColorsHex || !pokeColorsHex.length || !queryColors.length) return Infinity;

    const pokeRgbList = pokeColorsHex
        .map((h) => hexToRgb(h))
        .filter((c) => c);

    if (!pokeRgbList.length) return Infinity;

    if (mode === "average") {
        const qAvg = averageRgb(queryColors.map((c) => c.rgb));
        const pAvg = averageRgb(pokeRgbList);
        return colorDistanceSq(qAvg, pAvg);
    }

    const isSingleColorQuery = queryColors.length === 1;

    if (mode === "closest" && isSingleColorQuery) {
        const qAvg = queryColors[0].rgb;
        const pAvg = averageRgb(pokeRgbList);
        return colorDistanceSq(qAvg, pAvg);
    }

    if (mode === "any") {
        let best = Infinity;
        for (const qc of queryColors) {
            for (const pc of pokeRgbList) {
                const d = colorDistanceSq(qc.rgb, pc);
                if (d < best) best = d;
            }
        }
        return best;
    }

    // 默认（最近颜色优先，严格模式）：
    // 对每一个查询颜色，在宝可梦主色中找到最近的一块，且这块颜色必须足够接近；
    // 如果有任意一个查询颜色找不到足够接近的主色，则认为这只宝可梦与该组合不匹配。

    // 阈值说明：这是 RGB 欧氏距离平方的阈值。
    // 比如纯红(255,0,0) 和 纯绿(0,255,0) 的距离平方大约是 130000，远大于该阈值，
    // 会被判定为“不匹配该颜色”。
    // 严格度由滑动条控制：0 非常宽松，100 非常严格
    let strictValue = 60;
    if (strictnessRange) {
        const v = Number(strictnessRange.value);
        if (!Number.isNaN(v)) strictValue = Math.min(100, Math.max(0, v));
    }
    // 将 0-100 映射到一个合理的距离平方区间：宽松时阈值大，严格时阈值小
    const MAX_PER_COLOR_DIST = 40000 - (strictValue / 100) * 25000; // 约 40000 ~ 15000

    let total = 0;
    const remainingPokeColors = [...pokeRgbList];

    for (const qc of queryColors) {
        let bestIdx = -1;
        let bestDist = Infinity;

        for (let i = 0; i < remainingPokeColors.length; i++) {
            const pc = remainingPokeColors[i];
            const d = colorDistanceSq(qc.rgb, pc);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }

        // 没有可用主色，或者最近的那块颜色也太远 —— 直接视为整体不匹配
        if (bestIdx === -1 || bestDist > MAX_PER_COLOR_DIST) {
            return Infinity;
        }

        total += bestDist;
        // 占用这块颜色，后续查询颜色不能再复用
        remainingPokeColors.splice(bestIdx, 1);
    }

    return total;
}

function getActiveFilterSummary(filters) {
    const parts = [];
    if (filters.types.length) parts.push("属性: " + filters.types.join(" / "));
    if (filters.generation) parts.push("世代: " + filters.generation);
    if (filters.shape) parts.push("体型: " + filters.shape);
    if (filters.megaOnly) parts.push("只看 Mega");
    if (filters.gmaxOnly) parts.push("只看 G-Max");
    return parts.join(" · ");
}

function getCurrentFilters() {
    const types = Array.from(
        filterTypesContainer.querySelectorAll(".tag-option.selected"),
    ).map((el) => el.dataset.value);

    return {
        types,
        generation: filterGenerationSelect.value || "",
        shape: filterShapeSelect.value || "",
        megaOnly: filterMegaCheckbox.checked,
        gmaxOnly: filterGmaxCheckbox.checked,
    };
}

function applyFiltersToData(filters) {
    return allPokemon.filter((p) => {
        if (filters.types.length) {
            if (!p.types || !p.types.length) return false;
            const hasAll = filters.types.every((t) => p.types.includes(t));
            if (!hasAll) return false;
        }

        if (filters.generation) {
            if (p.generation !== filters.generation) return false;
        }

        if (filters.shape) {
            if (p.shape !== filters.shape) return false;
        }

        if (filters.megaOnly && !p.is_mega) return false;
        if (filters.gmaxOnly && !p.is_gmax) return false;

        return true;
    });
}

function renderResults(list, queryColors, mode) {
    resultsContainer.innerHTML = "";

    if (!list.length) {
        const empty = document.createElement("div");
        empty.textContent = "没有找到匹配的宝可梦，请调整颜色或筛选条件。";
        empty.style.fontSize = "13px";
        empty.style.color = "#888";
        resultsContainer.appendChild(empty);
        return;
    }

    const limit = Math.max(1, Math.min(200, Number(resultLimitInput.value) || 60));

    const withScore = list.map((p) => ({
        poke: p,
        score: computeColorScore(p.colors || [], queryColors, mode),
    }));

    withScore.sort((a, b) => a.score - b.score);

    const finalList = withScore
        .filter((item) => Number.isFinite(item.score))
        .slice(0, limit)
        .map((item) => item.poke);

    if (!finalList.length) {
        const empty = document.createElement("div");
        empty.textContent = "请添加颜色";
        empty.style.fontSize = "13px";
        empty.style.color = "#888";
        resultsContainer.appendChild(empty);
        return;
    }

    for (const p of finalList) {
        const card = document.createElement("article");
        card.className = "card";

        const header = document.createElement("div");
        header.className = "card-header";

        const nameEl = document.createElement("div");
        nameEl.className = "card-name";
        nameEl.textContent = p.name || p.name_en || "?";

        const indexEl = document.createElement("div");
        indexEl.className = "card-index";
        indexEl.textContent = p.index || "";

        header.appendChild(nameEl);
        header.appendChild(indexEl);

        const imgWrap = document.createElement("div");
        imgWrap.className = "card-img-wrap";
        const img = document.createElement("img");
        img.src = p.image_url || p.image || "";
        img.alt = p.name || p.name_en || "";
        img.loading = "lazy";
        imgWrap.appendChild(img);

        const tags = document.createElement("div");
        tags.className = "card-tags";

        if (p.types && p.types.length) {
            for (const t of p.types) {
                const tag = document.createElement("span");
                tag.className = "tag";
                tag.textContent = t;

                const c = TYPE_COLORS[t];
                if (c) {
                    tag.style.backgroundColor = c;
                    tag.style.color = "#ffffff";
                    tag.style.borderColor = c;
                }

                tags.appendChild(tag);
            }
        }

        if (p.generation) {
            const tag = document.createElement("span");
            tag.className = "tag tag-weak";
            tag.textContent = p.generation;
            tags.appendChild(tag);
        }

        if (p.shape) {
            const tag = document.createElement("span");
            tag.className = "tag tag-weak";
            tag.textContent = p.shape;
            tags.appendChild(tag);
        }

        if (p.is_mega) {
            const tag = document.createElement("span");
            tag.className = "tag";
            tag.textContent = "Mega";
            tags.appendChild(tag);
        }

        if (p.is_gmax) {
            const tag = document.createElement("span");
            tag.className = "tag";
            tag.textContent = "G-Max";
            tags.appendChild(tag);
        }

        const colorBar = document.createElement("div");
        colorBar.className = "card-color-bar";

        if (Array.isArray(p.colors) && p.colors.length) {
            const validColors = p.colors
                .map((h) => (typeof h === "string" ? h.trim() : ""))
                .filter((h) => /^#?[0-9a-fA-F]{6}$/.test(h))
                .map((h) => (h.startsWith("#") ? h : "#" + h));

            for (const c of validColors) {
                const seg = document.createElement("div");
                seg.className = "card-color-segment";
                seg.style.backgroundColor = c;
                colorBar.appendChild(seg);
            }
        }

        card.appendChild(header);
        card.appendChild(imgWrap);
        card.appendChild(tags);
        card.appendChild(colorBar);

        resultsContainer.appendChild(card);
    }
}

function matchByNameOrPinyin(p, qLower) {
    const nameFields = [p.name, p.name_en, p.name_jp];
    const pinyin = typeof p.pinyin === "string" ? p.pinyin.toLowerCase() : "";
    const initials =
        typeof p.pinyinInitials === "string"
            ? p.pinyinInitials.toLowerCase()
            : "";

    const nameMatch = nameFields.some(
        (f) => typeof f === "string" && f.toLowerCase().includes(qLower),
    );

    const pinyinMatch =
        (pinyin && pinyin.startsWith(qLower)) ||
        (initials && initials.startsWith(qLower));

    return nameMatch || pinyinMatch;
}

function showPokemonAsSingleResult(p, labelOverride, queryLabel) {
    const label = labelOverride || p.name || p.name_en || queryLabel || "";
    activeFiltersEl.textContent = `搜索: ${label}`;
    resultsContainer.innerHTML = "";

    const card = document.createElement("article");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const nameEl = document.createElement("div");
    nameEl.className = "card-name";
    nameEl.textContent = p.name || p.name_en || "?";

    const indexEl = document.createElement("div");
    indexEl.className = "card-index";
    indexEl.textContent = p.index || "";

    header.appendChild(nameEl);
    header.appendChild(indexEl);

    const imgWrap = document.createElement("div");
    imgWrap.className = "card-img-wrap";
    const img = document.createElement("img");
    img.src = p.image_url || p.image || "";
    img.alt = p.name || p.name_en || "";
    img.loading = "lazy";
    imgWrap.appendChild(img);

    const tags = document.createElement("div");
    tags.className = "card-tags";

    if (p.types && p.types.length) {
        for (const t of p.types) {
            const tag = document.createElement("span");
            tag.className = "tag";
            tag.textContent = t;

            const c = TYPE_COLORS[t];
            if (c) {
                tag.style.backgroundColor = c;
                tag.style.color = "#ffffff";
                tag.style.borderColor = c;
            }

            tags.appendChild(tag);
        }
    }

    if (p.generation) {
        const tag = document.createElement("span");
        tag.className = "tag tag-weak";
        tag.textContent = p.generation;
        tags.appendChild(tag);
    }

    if (p.shape) {
        const tag = document.createElement("span");
        tag.className = "tag tag-weak";
        tag.textContent = p.shape;
        tags.appendChild(tag);
    }

    if (p.is_mega) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = "Mega";
        tags.appendChild(tag);
    }

    if (p.is_gmax) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = "G-Max";
        tags.appendChild(tag);
    }

    const colorBar = document.createElement("div");
    colorBar.className = "card-color-bar";

    if (Array.isArray(p.colors) && p.colors.length) {
        const validColors = p.colors
            .map((h) => (typeof h === "string" ? h.trim() : ""))
            .filter((h) => /^#?[0-9a-fA-F]{6}$/.test(h))
            .map((h) => (h.startsWith("#") ? h : "#" + h));

        for (const c of validColors) {
            const seg = document.createElement("div");
            seg.className = "card-color-segment";
            seg.style.backgroundColor = c;
            colorBar.appendChild(seg);
        }
    }

    card.appendChild(header);
    card.appendChild(imgWrap);
    card.appendChild(tags);
    card.appendChild(colorBar);

    resultsContainer.appendChild(card);
}

function updateSearchSuggestions() {
    if (!allPokemon.length || !searchInput || !searchSuggestions) return;

    const q = searchInput.value.trim();
    const qLower = q.toLowerCase();

    if (!q) {
        searchSuggestions.innerHTML = "";
        searchSuggestions.classList.remove("visible");
        return;
    }

    const matches = allPokemon.filter((p) => matchByNameOrPinyin(p, qLower));

    searchSuggestions.innerHTML = "";

    const maxSuggest = 8;
    const suggestList = matches.slice(0, maxSuggest);

    if (!suggestList.length) {
        searchSuggestions.classList.remove("visible");
        searchActiveIndex = -1;
        return;
    }

    searchActiveIndex = -1;

    for (const p of suggestList) {
        const item = document.createElement("div");
        item.className = "search-suggestion-item";
        const name = p.name || p.name_en || "?";
        item.textContent = name;
        item.addEventListener("click", () => {
            searchInput.value = name;
            searchSuggestions.innerHTML = "";
            searchSuggestions.classList.remove("visible");
            showPokemonAsSingleResult(p, name);
        });
        searchSuggestions.appendChild(item);
    }

    searchSuggestions.classList.add("visible");
}

function runTextSearch() {
    if (!allPokemon.length || !searchInput) return;

    const q = searchInput.value.trim();
    const qLower = q.toLowerCase();

    if (!q) {
        resultsContainer.innerHTML = "";
        activeFiltersEl.textContent = "";
        return;
    }

    const matches = allPokemon.filter((p) => matchByNameOrPinyin(p, qLower));

    if (!matches.length) {
        activeFiltersEl.textContent = `搜索: ${q}`;
        resultsContainer.innerHTML = "";
        const empty = document.createElement("div");
        empty.textContent = "没有找到匹配的宝可梦，请尝试其他名称或拼音。";
        empty.style.fontSize = "13px";
        empty.style.color = "#888";
        resultsContainer.appendChild(empty);
        if (searchSuggestions) {
            searchSuggestions.innerHTML = "";
            searchSuggestions.classList.remove("visible");
        }
        return;
    }

    const p = matches[0];
    showPokemonAsSingleResult(p, null, q);
    if (searchSuggestions) {
        searchSuggestions.innerHTML = "";
        searchSuggestions.classList.remove("visible");
    }
}

function initFiltersUI() {
    const typeSet = new Set();
    const genSet = new Set();
    const shapeSet = new Set();

    for (const p of allPokemon) {
        if (Array.isArray(p.types)) {
            for (const t of p.types) typeSet.add(t);
        }
        if (p.generation) genSet.add(p.generation);
        if (p.shape) shapeSet.add(p.shape);
    }

    filterTypesContainer.innerHTML = "";
    Array.from(typeSet)
        .sort()
        .forEach((t) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "tag-option";
            btn.textContent = t;
            btn.dataset.value = t;
            const c = TYPE_COLORS[t];
            if (c) {
                btn.style.backgroundColor = c;
                btn.style.color = "#ffffff";
                btn.style.borderColor = c;
            }
            btn.addEventListener("click", () => {
                if (btn.classList.contains("selected")) {
                    // 取消选中永远允许
                    btn.classList.remove("selected");
                    clearSearchBox();
                    runSearch();
                    return;
                }

                const selectedCount = filterTypesContainer.querySelectorAll(
                    ".tag-option.selected",
                ).length;
                if (selectedCount >= 2) {
                    showToast("属性最多只能选择 2 个");
                    return;
                }

                btn.classList.add("selected");
                clearSearchBox();
                runSearch();
            });
            filterTypesContainer.appendChild(btn);
        });

    const gens = Array.from(genSet).sort();
    for (const g of gens) {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        filterGenerationSelect.appendChild(opt);
    }

    const shapes = Array.from(shapeSet).sort();
    for (const s of shapes) {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        filterShapeSelect.appendChild(opt);
    }

    // 非颜色类筛选控件变更时，自动重新匹配
    filterGenerationSelect.addEventListener("change", () => {
        clearSearchBox();
        runSearch();
    });
    filterShapeSelect.addEventListener("change", () => {
        clearSearchBox();
        runSearch();
    });
    filterMegaCheckbox.addEventListener("change", () => {
        clearSearchBox();
        runSearch();
    });
    filterGmaxCheckbox.addEventListener("change", () => {
        clearSearchBox();
        runSearch();
    });
}

// 匹配方式与结果数量变更时也自动刷新
matchModeSelect.addEventListener("change", () => {
    clearSearchBox();
    runSearch();
});
resultLimitInput.addEventListener("change", () => {
    clearSearchBox();
    runSearch();
});

if (strictnessRange) {
    strictnessRange.addEventListener("change", () => {
        clearSearchBox();
        runSearch();
    });
}

// 开始匹配按钮：仅在颜色发生变化后需要手动触发
if (runSearchBtn) {
    runSearchBtn.addEventListener("click", runSearch);
}

// 重置按钮
if (resetAllBtn) {
    resetAllBtn.addEventListener("click", () => {
        // 清空颜色选择
        colorInputsContainer.innerHTML = "";

        // 清空搜索框和下拉建议
        clearSearchBox();

        // 重置筛选条件
        filterGenerationSelect.value = "";
        filterShapeSelect.value = "";
        filterMegaCheckbox.checked = false;
        filterGmaxCheckbox.checked = false;

        // 取消已选中的属性 tag
        const selectedTags = filterTypesContainer.querySelectorAll(".tag-option.selected");
        selectedTags.forEach((el) => el.classList.remove("selected"));

        // 恢复匹配方式与数量为默认值
        matchModeSelect.value = "closest";
        resultLimitInput.value = "60";

        // 清空顶部的筛选说明
        activeFiltersEl.textContent = "";

        // 按当前（已清空）筛选条件刷新结果，相当于刚进入网站
        const filters = getCurrentFilters();
        filteredPokemon = applyFiltersToData(filters);
        renderResults(filteredPokemon, [], matchModeSelect.value);
    });
}

// 搜索框：按回车执行名称 / 拼音搜索，右侧只显示一张卡片
if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" && searchSuggestions && searchSuggestions.classList.contains("visible")) {
            e.preventDefault();
            const items = Array.from(searchSuggestions.querySelectorAll(".search-suggestion-item"));
            if (!items.length) return;
            searchActiveIndex = (searchActiveIndex + 1) % items.length;
            items.forEach((el, idx) => {
                el.classList.toggle("active", idx === searchActiveIndex);
            });
            if (searchActiveIndex >= 0) {
                searchInput.value = items[searchActiveIndex].textContent || "";
            }
        } else if (e.key === "ArrowUp" && searchSuggestions && searchSuggestions.classList.contains("visible")) {
            e.preventDefault();
            const items = Array.from(searchSuggestions.querySelectorAll(".search-suggestion-item"));
            if (!items.length) return;
            searchActiveIndex = (searchActiveIndex - 1 + items.length) % items.length;
            items.forEach((el, idx) => {
                el.classList.toggle("active", idx === searchActiveIndex);
            });
            if (searchActiveIndex >= 0) {
                searchInput.value = items[searchActiveIndex].textContent || "";
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            // 如果有高亮的下拉项，优先用该项；否则按当前输入运行搜索
            if (searchSuggestions && searchSuggestions.classList.contains("visible")) {
                const items = Array.from(searchSuggestions.querySelectorAll(".search-suggestion-item"));
                if (items.length && searchActiveIndex >= 0 && searchActiveIndex < items.length) {
                    const name = items[searchActiveIndex].textContent || "";
                    searchInput.value = name;
                }
            }
            runTextSearch();
        }
    });
    searchInput.addEventListener("input", () => {
        updateSearchSuggestions();
    });
}

async function loadData() {
    try {
        const res = await fetch(DATA_URL);
        if (!res.ok) {
            throw new Error("无法加载宝可梦数据，请确认 pokemon_data.json 是否存在");
        }
        const data = await res.json();

        allPokemon = data.map((p) => ({
            index: p.index,
            name: p.name,
            name_en: p.name_en,
            name_jp: p.name_jp,
            pinyin: p.pinyin,
            pinyinInitials: p.pinyinInitials,
            generation: p.generation,
            types: p.types || [],
            shape: p.shape || p.shape_cn || "",
            is_mega: Boolean(p.is_mega),
            is_gmax: Boolean(p.is_gmax),
            colors: p.colors || [],
            image: p.image,
            image_url: p.image_url || `images/${p.image}`,
        }));

        const filters = getCurrentFilters();
        filteredPokemon = applyFiltersToData(filters);
        initFiltersUI();
        renderResults(filteredPokemon, [], matchModeSelect.value);
    } catch (e) {
        console.error(e);
        showToast(e.message || "加载数据失败");
    }
}

loadData();
