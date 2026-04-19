// 数据文件路径（由后端脚本预先生成）
const DATA_URL = "pokemon_data.json";
const WIKI_URLS_URL = "wiki_urls.json";

let allPokemon = [];
let filteredPokemon = [];
let wikiUrls = {};

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

const langToggleBtn = document.getElementById("lang-toggle");

const titleSelectColors = document.getElementById("title-select-colors");
const subtitleSelectColors = document.getElementById("subtitle-select-colors");
const labelMatchMode = document.getElementById("label-match-mode");
const optionMatchClosest = document.getElementById("option-match-closest");
const optionMatchAverage = document.getElementById("option-match-average");
const optionMatchAny = document.getElementById("option-match-any");
const labelResultLimit = document.getElementById("label-result-limit");
const labelStrictness = document.getElementById("label-strictness");
const titleFilters = document.getElementById("title-filters");
const labelTypes = document.getElementById("label-types");
const labelGeneration = document.getElementById("label-generation");
const labelShape = document.getElementById("label-shape");
const optionGenerationAny = document.getElementById("option-generation-any");
const optionShapeAny = document.getElementById("option-shape-any");
const labelMegaOnly = document.getElementById("label-mega-only");
const labelGmaxOnly = document.getElementById("label-gmax-only");
const titleResults = document.getElementById("title-results");

const aboutTitle = document.getElementById("about-title");
const aboutText1 = document.getElementById("about-text-1");
const aboutText2 = document.getElementById("about-text-2");
const aboutText3 = document.getElementById("about-text-3");
const aboutAuthor = document.getElementById("about-author");
const aboutCloseBtn = document.getElementById("about-close");

const filterTypesContainer = document.getElementById("filter-types");
const filterGenerationSelect = document.getElementById("filter-generation");
const filterShapeSelect = document.getElementById("filter-shape");
const filterMegaCheckbox = document.getElementById("filter-mega");
const filterGmaxCheckbox = document.getElementById("filter-gmax");

const toastEl = document.getElementById("toast");

const themeToggleBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

let currentLang = "zh";

// 简单多语言文案表，后续如需调整文案只需改这里
const I18N = {
    zh: {
        search_placeholder: "搜索宝可梦（中文 / 拼音）",
        title_select_colors: "选择颜色",
        subtitle_select_colors: "最多 5 个颜色，用于匹配宝可梦主色调。",
        label_match_mode: "匹配方式",
        option_match_closest: "最近颜色优先",
        option_match_average: "与平均色接近",
        option_match_any: "任一颜色匹配",
        label_result_limit: "结果数量上限",
        label_strictness: "颜色严格度（数值越大越严格）",
        title_filters: "筛选条件",
        label_types: "属性（可多选）",
        label_generation: "世代",
        label_shape: "体型（shape）",
        option_generation_any: "不限",
        option_shape_any: "不限",
        label_mega_only: "只看超级进化 (Mega)",
        label_gmax_only: "只看超极巨化 (G-Max)",
        title_results: "匹配结果",
        btn_add_color: "添加颜色",
        btn_clear_colors: "清空",
        btn_run_search: "开始匹配",
        btn_reset_all: "重置",
        btn_about: "关于",
        about_title: "关于 Pokémon Finder",
        about_text_1:
            "Pokémon Finder 是一个支持“凭外貌找名字”和“凭名字看外貌”的宝可梦检索工具。",
        about_text_2:
            "你可以：在左侧选择最多 5 个颜色，并结合属性、世代、体型等筛选条件，找到配色和形象最接近的一批宝可梦；也可以在顶部输入名称 / 拼音，快速定位某只宝可梦并查看它的主色与外观。",
        about_text_3:
            "前端为纯静态页面，不依赖任何后端服务，所有计算在浏览器本地完成。宝可梦基础数据基于社区开源数据整理与增强，仅用于学习与交流。",
        about_author: "作者 @ZTMYO",
        about_close: "关闭",
    },
    en: {
        search_placeholder: "Search Pokémon (English name)",
        title_select_colors: "Select Colors",
        subtitle_select_colors: "Up to 5 colors to match Pokémon main colors.",
        label_match_mode: "Match mode",
        option_match_closest: "Closest colors first",
        option_match_average: "Close to average color",
        option_match_any: "Any color matches",
        label_result_limit: "Result limit",
        label_strictness: "Color strictness (higher = stricter)",
        title_filters: "Filters",
        label_types: "Types (multi-select)",
        label_generation: "Generation",
        label_shape: "Shape",
        option_generation_any: "Any",
        option_shape_any: "Any",
        label_mega_only: "Only Mega evolutions",
        label_gmax_only: "Only G-Max",
        title_results: "Results",
        btn_add_color: "Add color",
        btn_clear_colors: "Clear",
        btn_run_search: "Run match",
        btn_reset_all: "Reset",
        btn_about: "About",
        about_title: "About Pokémon Finder",
        about_text_1: "Pokémon Finder lets you search Pokémon by appearance or by name.",
        about_text_2:
            "Choose up to 5 colors and filters to find Pokémon with similar palettes, or type a name at the top to quickly locate one Pokémon and see its main colors.",
        about_text_3:
            "The frontend is a static site; all computation runs in your browser. Data is based on community datasets and used for learning and sharing only.",
        about_author: "Author @ZTMYO",
        about_close: "Close",
    },
};

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

function applyTranslations() {
    const dict = I18N[currentLang] || I18N.zh;

    if (searchInput && dict.search_placeholder) {
        searchInput.placeholder = dict.search_placeholder;
    }
    if (titleSelectColors && dict.title_select_colors) {
        titleSelectColors.textContent = dict.title_select_colors;
    }
    if (subtitleSelectColors && dict.subtitle_select_colors) {
        subtitleSelectColors.textContent = dict.subtitle_select_colors;
    }
    if (labelMatchMode && dict.label_match_mode) {
        labelMatchMode.textContent = dict.label_match_mode;
    }
    if (optionMatchClosest && dict.option_match_closest) {
        optionMatchClosest.textContent = dict.option_match_closest;
    }
    if (optionMatchAverage && dict.option_match_average) {
        optionMatchAverage.textContent = dict.option_match_average;
    }
    if (optionMatchAny && dict.option_match_any) {
        optionMatchAny.textContent = dict.option_match_any;
    }
    if (labelResultLimit && dict.label_result_limit) {
        labelResultLimit.textContent = dict.label_result_limit;
    }
    if (labelStrictness && dict.label_strictness) {
        labelStrictness.textContent = dict.label_strictness;
    }
    if (titleFilters && dict.title_filters) {
        titleFilters.textContent = dict.title_filters;
    }
    if (labelTypes && dict.label_types) {
        labelTypes.textContent = dict.label_types;
    }
    if (labelGeneration && dict.label_generation) {
        labelGeneration.textContent = dict.label_generation;
    }
    if (labelShape && dict.label_shape) {
        labelShape.textContent = dict.label_shape;
    }
    if (optionGenerationAny && dict.option_generation_any) {
        optionGenerationAny.textContent = dict.option_generation_any;
    }
    if (optionShapeAny && dict.option_shape_any) {
        optionShapeAny.textContent = dict.option_shape_any;
    }
    if (labelMegaOnly && dict.label_mega_only) {
        labelMegaOnly.textContent = dict.label_mega_only;
    }
    if (labelGmaxOnly && dict.label_gmax_only) {
        labelGmaxOnly.textContent = dict.label_gmax_only;
    }
    if (titleResults && dict.title_results) {
        titleResults.textContent = dict.title_results;
    }

    // 更新世代下拉选项的显示文本（保持值为中文，文本根据语言切换）
    if (filterGenerationSelect) {
        Array.from(filterGenerationSelect.options).forEach((opt) => {
            if (!opt.value) return;
            opt.textContent = getGenerationDisplayName(opt.value);
        });
    }

    // 更新体型下拉选项显示文本（保持值为中文，文本根据语言切换）
    if (filterShapeSelect) {
        Array.from(filterShapeSelect.options).forEach((opt) => {
            if (!opt.value) return;
            opt.textContent = getShapeDisplayName(opt.value);
        });
    }

    if (addColorBtn && dict.btn_add_color) {
        addColorBtn.textContent = dict.btn_add_color;
    }
    if (clearColorsBtn && dict.btn_clear_colors) {
        clearColorsBtn.textContent = dict.btn_clear_colors;
    }

    if (runSearchBtn && dict.btn_run_search) {
        runSearchBtn.textContent = dict.btn_run_search;
    }
    if (resetAllBtn && dict.btn_reset_all) {
        resetAllBtn.textContent = dict.btn_reset_all;
    }

    if (openAboutBtn && dict.btn_about) {
        openAboutBtn.textContent = dict.btn_about;
    }
    if (aboutTitle && dict.about_title) {
        aboutTitle.textContent = dict.about_title;
    }
    if (aboutText1 && dict.about_text_1) {
        aboutText1.textContent = dict.about_text_1;
    }
    if (aboutText2 && dict.about_text_2) {
        aboutText2.textContent = dict.about_text_2;
    }
    if (aboutText3 && dict.about_text_3) {
        aboutText3.textContent = dict.about_text_3;
    }
    if (aboutAuthor && dict.about_author) {
        aboutAuthor.textContent = dict.about_author;
    }
    if (aboutCloseBtn && dict.about_close) {
        aboutCloseBtn.textContent = dict.about_close;
    }
}

function setLang(lang) {
    currentLang = lang === "en" ? "en" : "zh";
    try {
        window.localStorage.setItem("pf-lang", currentLang);
    } catch (e) {}

    const root = document.documentElement;
    if (root) {
        root.lang = currentLang === "zh" ? "zh-CN" : "en";
    }

    if (langToggleBtn) {
        if (currentLang === "zh") {
            langToggleBtn.textContent = "EN";
            langToggleBtn.setAttribute("aria-label", "切换到英文");
        } else {
            langToggleBtn.textContent = "CN";
            langToggleBtn.setAttribute("aria-label", "Switch to Chinese");
        }
    }

    applyTranslations();

    // 更新左侧属性筛选按钮的文本（保持 data-value 为中文，文本根据语言切换）
    if (filterTypesContainer) {
        const typeButtons = filterTypesContainer.querySelectorAll(".tag-option");
        typeButtons.forEach((btn) => {
            const t = btn.dataset.value;
            if (!t) return;
            btn.textContent = getTypeDisplayName(t);
        });
    }

    const hasColorInputs =
        colorInputsContainer && colorInputsContainer.children.length > 0;

    // 如果当前已经选了颜色，则重新执行一次颜色匹配，以便结果卡片和提示文案切换语言
    if (hasColorInputs) {
        const colors = collectSelectedColors();
        if (colors.length) {
            clearSearchBox();
            runSearch();
        }
    }

    if (!hasColorInputs && resultsContainer && resultsContainer.children.length > 0) {
        // 未选择颜色时，如果结果区域里是空状态提示，也需要根据当前语言更新文案
        const first = resultsContainer.firstElementChild;
        if (first && first.style && first.style.fontSize === "13px") {
            const text = first.textContent || "";
            // 两类空状态：无匹配、请添加颜色
            const isNoMatchZh = text.includes("没有找到匹配的宝可梦");
            const isNoMatchEn = text.includes("No matching Pokémon");
            const isNeedColorZh = text.includes("请添加颜色");
            const isNeedColorEn = text.includes("Please add at least one color");

            if (isNoMatchZh || isNoMatchEn) {
                first.textContent =
                    currentLang === "zh"
                        ? "没有找到匹配的宝可梦，请调整颜色或筛选条件。"
                        : "No matching Pokémon. Try adjusting colors or filters.";
            } else if (isNeedColorZh || isNeedColorEn) {
                first.textContent =
                    currentLang === "zh"
                        ? "请添加颜色"
                        : "Please add at least one color";
            }
        }
    }

    // 不论当前是筛选结果还是文本搜索结果，只要右侧有卡片，就根据编号集合用当前语言重新渲染
    rerenderResultsByIndices();
    refreshActiveFiltersLabel();
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

// 属性名中英对照，用于在不同语言下切换显示（筛选按钮和卡片标签）
const TYPE_NAME_EN = {
    "虫": "Bug",
    "龙": "Dragon",
    "妖精": "Fairy",
    "火": "Fire",
    "幽灵": "Ghost",
    "地面": "Ground",
    "一般": "Normal",
    "超能力": "Psychic",
    "钢": "Steel",
    "恶": "Dark",
    "电": "Electric",
    "格斗": "Fighting",
    "飞行": "Flying",
    "草": "Grass",
    "冰": "Ice",
    "毒": "Poison",
    "岩石": "Rock",
    "水": "Water",
};

function getTypeDisplayName(typeZh) {
    if (currentLang === "en") {
        return TYPE_NAME_EN[typeZh] || typeZh;
    }
    return typeZh;
}

// 体型中英对照
const SHAPE_NAME_EN = {
    "人形": "Humanoid",
    "双手形": "Two-Armed",
    "双翅形": "Single Pair of Wings",
    "双腿形": "Bipedal",
    "双足兽形": "Bipedal Beast",
    "四足兽形": "Quadruped",
    "多翅形": "Multiple Pairs of Wings",
    "形": "Basic Shape",
    "柱形": "Cylindrical",
    "球形": "Spherical",
    "组合形": "Multiple Bodies",
    "虫形": "Insectoid",
    "蛇形": "Serpentine",
    "触手形": "Tentacled",
    "鱼形": "Fish",
};

function getShapeDisplayName(shapeZh) {
    if (currentLang === "en") {
        return SHAPE_NAME_EN[shapeZh] || shapeZh;
    }
    return shapeZh;
}

// 结果卡片：点击跳转到 52poke 百科对应条目
function attachWikiLink(card, p) {
    if (!card || !p) return;

    // 确定用于搜索的名称（优先中文名，然后是英文名）
    const nameToLink = p.name || p.name_en || "";
    if (!nameToLink) return;

    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
        try {
            // 优先使用从 wiki 页面提取的映射关系
            // 如果 wikiUrls 中存在该名称（或去除括号后的名称），则使用映射的 URL 后缀
            const cleanName = nameToLink.replace(/（.*）/g, "").trim();
            const wikiSuffix = wikiUrls[nameToLink] || wikiUrls[cleanName] || nameToLink;
            
            const encoded = encodeURIComponent(wikiSuffix);
            const url = `https://wiki.52poke.com/wiki/${encoded}`;
            window.open(url, "_blank", "noopener");
        } catch (e) {
            console.error("Wiki link error:", e);
        }
    });
}

// 根据当前语言创建一张宝可梦结果卡片（不改变结果集合，只负责展示）
function createResultCard(p) {
    const card = document.createElement("article");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const nameEl = document.createElement("div");
    nameEl.className = "card-name";
    nameEl.textContent =
        currentLang === "zh"
            ? p.name || p.name_en || "?"
            : p.name_en || p.name || "?";

    const indexEl = document.createElement("div");
    indexEl.className = "card-index";
    indexEl.textContent = p.index || "";

    header.appendChild(nameEl);
    header.appendChild(indexEl);

    const imgWrap = document.createElement("div");
    imgWrap.className = "card-img-wrap";
    const img = document.createElement("img");
    img.src = p.image_url || p.image || "";
    img.alt = nameEl.textContent || "";
    img.loading = "lazy";
    imgWrap.appendChild(img);

    const tags = document.createElement("div");
    tags.className = "card-tags";

    if (p.types && p.types.length) {
        for (const t of p.types) {
            const tag = document.createElement("span");
            tag.className = "tag";
            tag.textContent = getTypeDisplayName(t);

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
        tag.textContent = getGenerationDisplayName(p.generation);
        tags.appendChild(tag);
    }

    if (p.shape) {
        const tag = document.createElement("span");
        tag.className = "tag tag-weak";
        tag.textContent = getShapeDisplayName(p.shape);
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

    attachWikiLink(card, p);

    return card;
}

// 语言切换时：根据当前 results 区域里的编号集合重新渲染卡片，保持结果集合不变
function rerenderResultsByIndices() {
    if (!resultsContainer) return;
    const indexEls = resultsContainer.querySelectorAll(".card-index");
    if (!indexEls.length) return; // 没有卡片（可能是空状态提示）

    const indices = Array.from(indexEls)
        .map((el) => (el.textContent || "").trim())
        .filter(Boolean);
    if (!indices.length) return;

    const pokes = indices
        .map((idx) => allPokemon.find((p) => p.index === idx))
        .filter(Boolean);
    if (!pokes.length) return;

    resultsContainer.innerHTML = "";
    for (const p of pokes) {
        const card = createResultCard(p);
        resultsContainer.appendChild(card);
    }
}

// 语言切换时：根据当前 activeFilters 的内容和编号，更新前缀与名字
function refreshActiveFiltersLabel() {
    if (!activeFiltersEl) return;
    const text = activeFiltersEl.textContent || "";
    if (!text) return;

    const prefix = currentLang === "zh" ? "搜索" : "Search";

    // 形如 "搜索: 0025-皮卡丘" / "Search: 0025-Pikachu"
    const m = /^(搜索|Search):\s*(\d{4})(?:-(.*))?$/.exec(text);
    if (!m) {
        // 非编号搜索，仅替换前缀
        if (text.startsWith("搜索:") || text.startsWith("Search:")) {
            const rest = text.split(":").slice(1).join(":").trim();
            const newLabel = rest ? `${prefix}: ${rest}` : `${prefix}:`;
            activeFiltersEl.textContent = newLabel;
            if (searchInput) {
                searchInput.value = rest;
            }
        }
        return;
    }

    const idx = m[2];
    const p = allPokemon.find((x) => x.index === idx);
    if (!p) {
        const rest = m[3] ? `${idx}-${m[3].trim()}` : idx;
        activeFiltersEl.textContent = `${prefix}: ${rest}`;
        return;
    }

    const localizedName =
        currentLang === "zh"
            ? p.name || p.name_en || m[3] || ""
            : p.name_en || p.name || m[3] || "";
    const rest = localizedName ? `${idx}-${localizedName}` : idx;
    const newLabel = `${prefix}: ${rest}`;
    activeFiltersEl.textContent = newLabel;
    if (searchInput) {
        searchInput.value = rest;
    }
}

// 世代显示与排序
const GENERATION_ORDER = {
    "第一世代": 1,
    "第二世代": 2,
    "第三世代": 3,
    "第四世代": 4,
    "第五世代": 5,
    "第六世代": 6,
    "第七世代": 7,
    "第八世代": 8,
    "第九世代": 9,
};

const GENERATION_NAME_EN = {
    "第一世代": "Generation I",
    "第二世代": "Generation II",
    "第三世代": "Generation III",
    "第四世代": "Generation IV",
    "第五世代": "Generation V",
    "第六世代": "Generation VI",
    "第七世代": "Generation VII",
    "第八世代": "Generation VIII",
    "第九世代": "Generation IX",
};

function getGenerationDisplayName(genZh) {
    if (currentLang === "en") {
        return GENERATION_NAME_EN[genZh] || genZh;
    }
    return genZh;
}

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

try {
    const storedLang = window.localStorage.getItem("pf-lang");
    if (storedLang === "zh" || storedLang === "en") {
        currentLang = storedLang;
    }
} catch (e) {}

setLang(currentLang);

if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
        const next = currentLang === "zh" ? "en" : "zh";
        setLang(next);
    });
}

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
    if (filters.types.length) {
        const label = currentLang === "zh" ? "属性" : "Type";
        parts.push(
            label + ": " + filters.types.map((t) => getTypeDisplayName(t)).join(" / "),
        );
    }
    if (filters.generation) {
        const label = currentLang === "zh" ? "世代" : "Generation";
        parts.push(label + ": " + getGenerationDisplayName(filters.generation));
    }
    if (filters.shape) {
        const label = currentLang === "zh" ? "体型" : "Shape";
        parts.push(label + ": " + getShapeDisplayName(filters.shape));
    }
    if (filters.megaOnly) parts.push(currentLang === "zh" ? "只看 Mega" : "Only Mega");
    if (filters.gmaxOnly)
        parts.push(currentLang === "zh" ? "只看 G-Max" : "Only G-Max");
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
        empty.textContent =
            currentLang === "zh"
                ? "没有找到匹配的宝可梦，请调整颜色或筛选条件。"
                : "No matching Pokémon. Try adjusting colors or filters.";
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
        empty.textContent =
            currentLang === "zh" ? "请添加颜色" : "Please add at least one color";
        empty.style.fontSize = "13px";
        empty.style.color = "#888";
        resultsContainer.appendChild(empty);
        return;
    }

    for (const p of finalList) {
        const card = createResultCard(p);
        resultsContainer.appendChild(card);
    }
}

function matchByNameOrPinyin(p, qLower) {
    // 中文模式：按中文名 + 拼音模糊 / 前缀匹配
    if (currentLang === "zh") {
        const zhName = typeof p.name === "string" ? p.name.toLowerCase() : "";
        const pinyin = typeof p.pinyin === "string" ? p.pinyin.toLowerCase() : "";
        const initials =
            typeof p.pinyinInitials === "string"
                ? p.pinyinInitials.toLowerCase()
                : "";

        const nameMatch = zhName && zhName.includes(qLower);
        // 拼音支持子串模糊匹配，例如 "pika" 命中 "huanzhuangpikaqiu"
        const pinyinMatch =
            (pinyin && pinyin.includes(qLower)) ||
            // 首字母仍然用前缀匹配，适配 PKQ 这类输入
            (initials && initials.startsWith(qLower));

        return nameMatch || pinyinMatch;
    }

    // 英文模式：仅按英文名模糊匹配
    const enName = typeof p.name_en === "string" ? p.name_en.toLowerCase() : "";
    return enName && enName.includes(qLower);
}

function showPokemonAsSingleResult(p, labelOverride, queryLabel) {
    const displayName =
        currentLang === "zh"
            ? p.name || p.name_en || queryLabel || ""
            : p.name_en || p.name || queryLabel || "";
    const label = labelOverride || displayName;
    const prefix = currentLang === "zh" ? "搜索" : "Search";
    activeFiltersEl.textContent = `${prefix}: ${label}`;
    resultsContainer.innerHTML = "";

    const card = document.createElement("article");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const nameEl = document.createElement("div");
    nameEl.className = "card-name";
    nameEl.textContent = displayName || "?";

    const indexEl = document.createElement("div");
    indexEl.className = "card-index";
    indexEl.textContent = p.index || "";

    header.appendChild(nameEl);
    header.appendChild(indexEl);

    const imgWrap = document.createElement("div");
    imgWrap.className = "card-img-wrap";
    const img = document.createElement("img");
    img.src = p.image_url || p.image || "";
    img.alt = displayName || "";
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
        tag.textContent = getGenerationDisplayName(p.generation);
        tags.appendChild(tag);
    }

    if (p.shape) {
        const tag = document.createElement("span");
        tag.className = "tag tag-weak";
        tag.textContent = getShapeDisplayName(p.shape);
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

    attachWikiLink(card, p);

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

    // 纯 4 位编号输入（例如 0025）不展示下拉建议，由回车触发的 runTextSearch 负责按编号搜索
    if (/^[0-9]{4}$/.test(q)) {
        searchSuggestions.innerHTML = "";
        searchSuggestions.classList.remove("visible");
        return;
    }

    // 若输入形如 "0001-xxx" 或仅 "0001"，优先按编号匹配
    const indexMatch = /^([0-9]{4})\b/.exec(q);
    if (indexMatch) {
        const idx = indexMatch[1];
        const indexMatches = allPokemon.filter(
            (x) => typeof x.index === "string" && x.index.startsWith(idx),
        );
        if (indexMatches.length === 1) {
            // 只有一个变种时仍按单卡展示
            const p = indexMatches[0];
            const baseName = q.includes("-")
                ? q.split("-").slice(1).join("-").trim()
                : q;
            showPokemonAsSingleResult(p, q, baseName);
            if (searchSuggestions) {
                searchSuggestions.innerHTML = "";
                searchSuggestions.classList.remove("visible");
            }
            return;
        }

        if (indexMatches.length > 1) {
            // 多个变种：在结果区域展示所有对应卡片
            const prefix = currentLang === "zh" ? "搜索" : "Search";
            activeFiltersEl.textContent = `${prefix}: ${q}`;
            resultsContainer.innerHTML = "";

            for (const p of indexMatches) {
                const card = document.createElement("article");
                card.className = "card";

                const header = document.createElement("div");
                header.className = "card-header";

                const nameEl = document.createElement("div");
                nameEl.className = "card-name";
                nameEl.textContent =
                    currentLang === "zh"
                        ? p.name || p.name_en || "?"
                        : p.name_en || p.name || "?";

                const indexEl = document.createElement("div");
                indexEl.className = "card-index";
                indexEl.textContent = p.index || "";

                header.appendChild(nameEl);
                header.appendChild(indexEl);

                const imgWrap = document.createElement("div");
                imgWrap.className = "card-img-wrap";
                const img = document.createElement("img");
                img.src = p.image_url || p.image || "";
                img.alt =
                    currentLang === "zh"
                        ? p.name || p.name_en || ""
                        : p.name_en || p.name || "";
                img.loading = "lazy";
                imgWrap.appendChild(img);

                const tags = document.createElement("div");
                tags.className = "card-tags";

                if (p.types && p.types.length) {
                    for (const t of p.types) {
                        const tag = document.createElement("span");
                        tag.className = "tag";
                        tag.textContent = getTypeDisplayName(t);

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

            if (searchSuggestions) {
                searchSuggestions.innerHTML = "";
                searchSuggestions.classList.remove("visible");
            }

            return;
        }

        // 没有任何编号匹配时，不再继续按名称/拼音清空结果，直接返回，保留当前 result
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
        const baseName =
            currentLang === "zh"
                ? p.name || p.name_en || "?"
                : p.name_en || p.name || "?";
        const indexLabel = p.index || "";
        const display = indexLabel ? `${indexLabel}-${baseName}` : baseName;
        item.textContent = display;
        if (indexLabel) item.dataset.index = indexLabel;
        item.addEventListener("click", () => {
            searchInput.value = display;
            searchSuggestions.innerHTML = "";
            searchSuggestions.classList.remove("visible");
            showPokemonAsSingleResult(p, display, baseName);
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

    // 纯 4 位编号输入：按图鉴编号前缀展示所有变种（如 0025, 0025.1, 0025.2, 0025.3）
    const indexOnlyMatch = /^([0-9]{4})$/.exec(q);
    if (indexOnlyMatch) {
        const idx = indexOnlyMatch[1];
        const indexMatches = allPokemon.filter(
            (p) => typeof p.index === "string" && p.index.startsWith(idx),
        );

        const prefix = currentLang === "zh" ? "搜索" : "Search";
        activeFiltersEl.textContent = `${prefix}: ${q}`;

        if (!indexMatches.length) {
            // 没有任何该编号的宝可梦，给出空提示
            resultsContainer.innerHTML = "";
            const empty = document.createElement("div");
            empty.textContent =
                currentLang === "zh"
                    ? "没有找到匹配的宝可梦，请尝试其他名称或拼音。"
                    : "No matching Pokémon. Try another name or index.";
            empty.style.fontSize = "13px";
            empty.style.color = "#888";
            resultsContainer.appendChild(empty);
        } else if (indexMatches.length === 1) {
            // 单个变种时复用单卡渲染逻辑
            const p = indexMatches[0];
            const baseName =
                currentLang === "zh"
                    ? p.name || p.name_en || q
                    : p.name_en || p.name || q;
            showPokemonAsSingleResult(p, `${idx}-${baseName}`, baseName);
        } else {
            // 多个变种：展示所有对应卡片
            resultsContainer.innerHTML = "";
            for (const p of indexMatches) {
                const card = createResultCard(p);
                resultsContainer.appendChild(card);
            }
        }

        if (searchSuggestions) {
            searchSuggestions.innerHTML = "";
            searchSuggestions.classList.remove("visible");
        }

        return;
    }

    // 形如 "0001-xxx" 的输入：同样按编号前缀处理
    const indexWithNameMatch = /^([0-9]{4})-(.+)$/.exec(q);
    if (indexWithNameMatch) {
        const idx = indexWithNameMatch[1];
        const indexMatches = allPokemon.filter(
            (p) => typeof p.index === "string" && p.index.startsWith(idx),
        );

        const prefix = currentLang === "zh" ? "搜索" : "Search";
        activeFiltersEl.textContent = `${prefix}: ${q}`;

        if (!indexMatches.length) {
            resultsContainer.innerHTML = "";
            const empty = document.createElement("div");
            empty.textContent =
                currentLang === "zh"
                    ? "没有找到匹配的宝可梦，请尝试其他名称或拼音。"
                    : "No matching Pokémon. Try another name or index.";
            empty.style.fontSize = "13px";
            empty.style.color = "#888";
            resultsContainer.appendChild(empty);
        } else if (indexMatches.length === 1) {
            const p = indexMatches[0];
            const baseName =
                currentLang === "zh"
                    ? p.name || p.name_en || q
                    : p.name_en || p.name || q;
            showPokemonAsSingleResult(p, q, baseName);
        } else {
            resultsContainer.innerHTML = "";
            for (const p of indexMatches) {
                const card = createResultCard(p);
                resultsContainer.appendChild(card);
            }
        }

        if (searchSuggestions) {
            searchSuggestions.innerHTML = "";
            searchSuggestions.classList.remove("visible");
        }

        return;
    }

    const matches = allPokemon.filter((p) => matchByNameOrPinyin(p, qLower));

    if (!matches.length) {
        const prefix = currentLang === "zh" ? "搜索" : "Search";
        activeFiltersEl.textContent = `${prefix}: ${q}`;
        resultsContainer.innerHTML = "";
        const empty = document.createElement("div");
        empty.textContent =
            currentLang === "zh"
                ? "没有找到匹配的宝可梦，请尝试其他名称或拼音。"
                : "No matching Pokémon. Try another name or index.";
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
    const baseName =
        currentLang === "zh"
            ? p.name || p.name_en || q
            : p.name_en || p.name || q;
    const labelOverride = p.index ? `${p.index}-${baseName}` : baseName;
    showPokemonAsSingleResult(p, labelOverride, baseName);
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
            btn.textContent = getTypeDisplayName(t);
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

    const gens = Array.from(genSet).sort((a, b) => {
        const oa = GENERATION_ORDER[a] || 99;
        const ob = GENERATION_ORDER[b] || 99;
        return oa - ob;
    });
    for (const g of gens) {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = getGenerationDisplayName(g);
        filterGenerationSelect.appendChild(opt);
    }

    const shapes = Array.from(shapeSet).sort();
    for (const s of shapes) {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = getShapeDisplayName(s);
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
            // 如果有高亮的下拉项，优先用该项；如果该项带有编号，则根据 index 精确匹配
            if (searchSuggestions && searchSuggestions.classList.contains("visible")) {
                const items = Array.from(
                    searchSuggestions.querySelectorAll(".search-suggestion-item"),
                );
                if (items.length && searchActiveIndex >= 0 && searchActiveIndex < items.length) {
                    const item = items[searchActiveIndex];
                    const display = item.textContent || "";
                    const idx = item.dataset.index || "";
                    searchInput.value = display;

                    if (idx) {
                        const p = allPokemon.find((x) => x.index === idx);
                        if (p) {
                            const baseName = display.includes("-")
                                ? display.split("-").slice(1).join("-").trim()
                                : display;
                            searchSuggestions.innerHTML = "";
                            searchSuggestions.classList.remove("visible");
                            showPokemonAsSingleResult(p, display, baseName);
                            return;
                        }
                    }
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
        // 并行加载宝可梦数据和 Wiki 映射数据
        const [pokemonRes, wikiRes] = await Promise.all([
            fetch(DATA_URL),
            fetch(WIKI_URLS_URL).catch(() => null) // 如果 Wiki 数据加载失败，不影响主流程
        ]);

        if (!pokemonRes.ok) {
            throw new Error("无法加载宝可梦数据，请确认 pokemon_data.json 是否存在");
        }
        
        const data = await pokemonRes.json();
        if (wikiRes && wikiRes.ok) {
            wikiUrls = await wikiRes.json();
        }

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
