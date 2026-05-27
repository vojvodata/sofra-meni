var SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSE-maRzQg7ujK2PyV0HZETYuci6Ud7ps-OwvM18Rd2jDETZRGec6dP24CKznGBw5jBxn02txcZHd6H/pub?output=csv';
var menuData = [];
var currentLang = localStorage.getItem('sofraLang') || 'mk';

function splitCSVRow(line) {
    var result = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '"') {
            if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
            else { inQ = !inQ; }
        } else if (c === ',' && !inQ) {
            result.push(cur); cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur);
    return result;
}

function parseCSV(text) {
    var lines = text.split(/\r?\n/);
    var headers = splitCSVRow(lines[0]).map(function (h) { return h.trim(); });
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        var cols = splitCSVRow(lines[i]);
        var row = {};
        headers.forEach(function (h, j) { row[h] = (cols[j] || '').trim(); });
        rows.push(row);
    }
    return rows;
}

function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMenu(lang) {
    var tabs = ['breakfast', 'appetizers', 'grill', 'salads', 'specialties', 'drinks', 'alcohol'];
    tabs.forEach(function (tab) {
        var panel = document.getElementById('tab-' + tab);
        if (!panel) return;
        var tabRows = menuData.filter(function (r) { return r.tab === tab; });
        if (!tabRows.length) return;
        var html = '', open = false;
        tabRows.forEach(function (r) {
            var secMk = (r.section_mk || '').trim();
            if (secMk) {
                if (open) html += '</div>';
                open = true;
                var secName = esc(r['section_' + lang] || secMk);
                html += '<div class="menu-section"><div class="section-header"><div class="section-title">' + secName + '</div></div>';
            }
            var name = esc((r['name_' + lang] || r.name_mk || '').trim());
            var weight = esc((r.weight || '').trim());
            var price = esc((r.price || '').trim());
            if (!name) return;
            html += '<div class="menu-item"><div class="item-info"><div class="item-name">' + name + '</div>';
            if (weight) html += '<div class="item-weight">' + weight + '</div>';
            html += '</div>';
            if (price) html += '<div class="item-price">' + price + '</div>';
            html += '</div>';
        });
        if (open) html += '</div>';
        if (tab === 'breakfast') {
            var note = panel.querySelector('.allergen-note');
            panel.innerHTML = html;
            if (note) panel.appendChild(note);
        } else {
            panel.innerHTML = html;
        }
    });
}

function applyUI(lang) {
    var flags = { mk: 'mk', en: 'gb', el: 'gr' };
    var codes = { mk: 'МК', en: 'EN', el: 'ΕΛ' };
    document.getElementById('langFlag').className = 'fi fi-' + (flags[lang] || 'mk');
    document.getElementById('langCode').textContent = codes[lang] || 'МК';
    document.querySelectorAll('[data-mk]').forEach(function (el) {
        el.textContent = el.getAttribute('data-' + lang) || el.getAttribute('data-mk');
    });
    document.querySelectorAll('.lang-menu button').forEach(function (b) { b.classList.remove('active'); });
    var a = document.querySelector('.lang-menu button[data-lang="' + lang + '"]');
    if (a) a.classList.add('active');
}

function setLang(lang) {
    currentLang = lang;
    renderMenu(lang);
    applyUI(lang);
    document.getElementById('langDropdown').classList.remove('open');
    localStorage.setItem('sofraLang', lang);
}

function toggleLangMenu() {
    document.getElementById('langDropdown').classList.toggle('open');
}

document.addEventListener('click', function (e) {
    var dd = document.getElementById('langDropdown');
    if (dd && !dd.contains(e.target)) dd.classList.remove('open');
});

function showTab(name, btn) {
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    document.getElementById('tab-' + name).classList.add('active');
    btn.classList.add('active');
}

(function loadMenu() {
    if (!SHEET_URL || SHEET_URL.indexOf('PASTE') === 0) {
        document.getElementById('menu-loading').style.display = 'none';
        var e = document.getElementById('menu-error');
        e.style.display = 'block';
        e.textContent = 'Гоогле Шитс URL не е поставен. Контактирајте го администраторот.';
        return;
    }
    fetch(SHEET_URL)
        .then(function (r) { if (!r.ok) throw r.status; return r.text(); })
        .then(function (csv) {
            menuData = parseCSV(csv);
            document.getElementById('menu-loading').style.display = 'none';
            renderMenu(currentLang);
            applyUI(currentLang);
        })
        .catch(function () {
            document.getElementById('menu-loading').style.display = 'none';
            var e = document.getElementById('menu-error');
            e.style.display = 'block';
            e.textContent = 'Менито не може да се вчита. Обидете се повторно подоцна.';
        });
})();
