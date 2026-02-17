const API_BASE = "https://phimkhoi.com";

const KEYS = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
    ENTER: 13, RETURN: 10009, BACK: 461
};

const App = {
    focus: null,      // Current visual focus element
    area: 'sidebar',  // sidebar, grid, detail, player

    // Data
    currentCategory: 'phim-le',
    movies: [],

    // Scroll state
    scrollOffset: 0,

    init: async function () {
        console.log("App Init");
        this.setupKeys();

        // Initial Fetch
        await this.loadCategory('phim-le');

        // Initial Focus: Sidebar 'Phim Le'
        // Index 0 is Search, Index 1 is Phim Le
        const items = document.querySelectorAll('.menu-item');
        if (items.length > 1) this.setFocus(items[1]);
    },

    loadCategory: async function (type) {
        this.currentCategory = type;
        const searchContainer = document.getElementById('search-container');
        const title = document.getElementById('page-title');

        if (type === 'search') {
            searchContainer.classList.remove('hidden');
            title.innerText = "Kết Quả Tìm Kiếm";
            document.getElementById('movie-grid').innerHTML = '';
            // Focus input
            const input = document.getElementById('search-input');
            input.value = '';
            input.focus();
            this.focus = input; // Special focus state
        } else {
            searchContainer.classList.add('hidden');
            title.innerText = this.getCategoryName(type);
            document.getElementById('movie-grid').innerHTML = '<div style="font-size:24px">Đang tải...</div>';

            try {
                const res = await fetch(`${API_BASE}/v1/api/danh-sach/${type}?limit=24`);
                const data = await res.json();
                const items = data.data?.items || data.items || [];
                this.renderGrid(items);
            } catch (e) {
                console.error(e);
            }
        }
    },

    searchMovies: async function (query) {
        document.getElementById('movie-grid').innerHTML = '<div style="font-size:24px">Đang tìm kiếm...</div>';
        try {
            const res = await fetch(`${API_BASE}/v1/api/tim-kiem?keyword=${query}&limit=20`);
            const data = await res.json();
            const items = data.data?.items || data.items || [];
            this.renderGrid(items);
        } catch (e) {
            console.error(e);
        }
    },

    getCategoryName: function (slug) {
        const map = { 'phim-le': 'Phim Lẻ', 'phim-bo': 'Phim Bộ', 'hoat-hinh': 'Hoạt Hình', 'tv-shows': 'TV Shows' };
        return map[slug] || 'Danh Sách';
    },

    renderGrid: function (items) {
        const grid = document.getElementById('movie-grid');
        grid.innerHTML = '';
        this.movies = items;

        if (items.length === 0) {
            grid.innerHTML = '<div style="font-size:24px; color:#666">Không tìm thấy phim nào.</div>';
            return;
        }

        items.forEach((m, i) => {
            const url = m.thumb_url.includes('http') ? m.thumb_url : `https://phimimg.com/${m.thumb_url}`;
            const div = document.createElement('div');
            div.className = 'movie-card';
            div.dataset.slug = m.slug;
            div.innerHTML = `<img src="${url}">`;
            grid.appendChild(div);
        });
    },

    setFocus: function (el) {
        if (!el) return;
        if (this.focus) this.focus.blur && this.focus.blur(); // Blur execution if input
        if (this.focus && this.focus.classList) this.focus.classList.remove('active');

        this.focus = el;
        if (el.classList) el.classList.add('active');
        if (el.tagName === 'INPUT') el.focus();

        // Auto-scroll Sidebar or Grid
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    },

    handleKey: function (e) {
        if (this.area === 'player') { this.handlePlayer(e); return; }
        if (this.area === 'detail') { this.handleDetail(e); return; }

        // Special handling for Search Input
        if (this.focus && this.focus.tagName === 'INPUT') {
            if (e.keyCode === KEYS.ENTER) {
                this.searchMovies(this.focus.value);
                // Move focus to grid if results exist? 
                // Or keep focus on input to type more.
                this.focus.blur(); // Hide keyboard?
            }
            if (e.keyCode === KEYS.DOWN) {
                this.area = 'grid';
                const first = document.querySelector('.movie-card');
                if (first) this.setFocus(first);
            }
            if (e.keyCode === KEYS.LEFT) {
                this.area = 'sidebar';
                const menu = document.querySelector('.menu-item[data-type="search"]');
                this.setFocus(menu);
            }
            return; // Don't do standard nav while in input
        }

        // Sidebar <-> Grid Navigation
        switch (e.keyCode) {
            // ... (Previous Switch Logic) ...
            case KEYS.RIGHT:
                if (this.area === 'sidebar') {
                    // Check if search active
                    if (this.currentCategory === 'search') {
                        const input = document.getElementById('search-input');
                        this.setFocus(input);
                        // Area remains sidebar effectively or 'search-input'
                    } else {
                        this.area = 'grid';
                        const firstCard = document.querySelector('.movie-card');
                        if (firstCard) this.setFocus(firstCard);
                    }
                } else {
                    this.moveFocus(1);
                }
                break;
            case KEYS.LEFT:
                if (this.area === 'grid') {
                    const all = Array.from(document.querySelectorAll('.movie-card'));
                    const idx = all.indexOf(this.focus);
                    if (idx === 0 || idx % 5 === 0) {
                        this.area = 'sidebar';
                        const activeMenu = document.querySelector('.menu-item[data-type="' + this.currentCategory + '"]') || document.querySelector('.menu-item');
                        this.setFocus(activeMenu);
                    } else {
                        this.moveFocus(-1);
                    }
                }
                break;
            case KEYS.UP:
                if (this.area === 'sidebar') this.moveSidebar(-1);
                else this.moveFocus(-5);
                break;
            case KEYS.DOWN:
                if (this.area === 'sidebar') this.moveSidebar(1);
                else this.moveFocus(5);
                break;
            case KEYS.ENTER:
                if (this.area === 'sidebar') {
                    const type = this.focus.dataset.type;
                    if (type) this.loadCategory(type);
                } else {
                    const slug = this.focus.dataset.slug;
                    this.openDetail(slug);
                }
                break;
            case KEYS.RETURN:
            case KEYS.BACK:
                tizen.application.getCurrentApplication().exit();
                break;
        }
    },

    moveSidebar: function (offset) {
        const items = Array.from(document.querySelectorAll('.menu-item'));
        let idx = items.indexOf(this.focus);
        let newIdx = idx + offset;
        if (newIdx >= 0 && newIdx < items.length) this.setFocus(items[newIdx]);
    },

    moveFocus: function (offset) {
        const items = Array.from(document.querySelectorAll('.movie-card'));
        let idx = items.indexOf(this.focus);
        let newIdx = idx + offset;
        if (newIdx >= 0 && newIdx < items.length) this.setFocus(items[newIdx]);
    },

    openDetail: async function (slug) {
        document.getElementById('detail-overlay').style.display = 'flex';
        this.area = 'detail';

        try {
            const res = await fetch(`${API_BASE}/phim/${slug}`);
            const data = await res.json();
            const m = data.movie;

            document.getElementById('detail-title').innerText = m.name;
            document.getElementById('detail-meta').innerText = `${m.year} • ${m.time}`;
            document.getElementById('detail-desc').innerText = m.content.replace(/<[^>]*>?/gm, '').substring(0, 300) + '...';
            document.getElementById('detail-img').src = m.poster_url;

            // Render Episodes
            const list = document.getElementById('episode-list');
            list.innerHTML = '';
            let allEps = [];
            if (data.episodes) {
                allEps = data.episodes.flatMap(s => s.server_data);
            }
            allEps.forEach((ep) => {
                const btn = document.createElement('div');
                btn.className = 'episode-btn';
                btn.innerText = ep.name;
                btn.dataset.link = ep.link_m3u8;
                list.appendChild(btn);
            });
            const firstEp = list.firstChild;
            if (firstEp) this.setFocus(firstEp);

        } catch (e) { console.error(e); }
    },

    // ... (Detail Handling Same) ...
    handleDetail: function (e) {
        switch (e.keyCode) {
            case KEYS.BACK:
            case KEYS.RETURN:
                document.getElementById('detail-overlay').style.display = 'none';
                this.area = 'grid';
                this.setFocus(document.querySelector('.movie-card[data-slug]') || document.querySelector('.movie-card'));
                break;
            case KEYS.RIGHT: this.moveEp(1); break;
            case KEYS.LEFT: this.moveEp(-1); break;
            case KEYS.UP: this.moveEp(-5); break;
            case KEYS.DOWN: this.moveEp(5); break;
            case KEYS.ENTER:
                const url = this.focus.dataset.link;
                if (url) this.playVideo(url, document.getElementById('detail-title').innerText, this.focus.innerText);
                break;
        }
    },

    moveEp: function (offset) {
        const items = Array.from(document.querySelectorAll('.episode-btn'));
        let idx = items.indexOf(this.focus);
        let newIdx = idx + offset;
        if (newIdx >= 0 && newIdx < items.length) this.setFocus(items[newIdx]);
    },

    playVideo: function (url, title, epName) {
        this.area = 'player';
        const video = document.getElementById('video');
        const errorMsg = document.getElementById('error-msg');
        errorMsg.style.display = 'none';

        document.getElementById('player-container').style.display = 'block';
        document.getElementById('player-title').innerText = `${title} - Tập ${epName || ''}`;

        if (Hls.isSupported()) {
            if (this.hls) {
                this.hls.destroy();
            }
            this.hls = new Hls();
            this.hls.loadSource(url);
            this.hls.attachMedia(video);
            this.hls.on(Hls.Events.MANIFEST_PARSED, function () {
                video.play().catch(e => console.error("Play failed", e));
            });
            this.hls.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    console.error("HLS Fatal Error", data);
                    errorMsg.innerText = "Lỗi luồng: " + data.details;
                    errorMsg.style.display = 'block';
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log("fatal network error encountered, try to recover");
                            this.hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log("fatal media error encountered, try to recover");
                            this.hls.recoverMediaError();
                            break;
                        default:
                            this.hls.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (Safari / Older Tizen?)
            video.src = url;
            video.addEventListener('loadedmetadata', function () {
                video.play();
            });
        } else {
            errorMsg.innerText = "Thiết bị không hỗ trợ HLS";
            errorMsg.style.display = 'block';
        }

        // Progress Interval
        if (this.playerInt) clearInterval(this.playerInt);
        this.playerInt = setInterval(() => {
            if (video.duration) {
                const pct = (video.currentTime / video.duration) * 100;
                document.getElementById('progress-bar').style.width = `${pct}%`;

                const cur = Math.floor(video.currentTime);
                const total = Math.floor(video.duration || 0);
                document.getElementById('time-display').innerText = `${this.fmtTime(cur)} / ${this.fmtTime(total)}`;
            }
        }, 1000);
    },

    fmtTime: function (s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' + sec : sec}`;
    },

    handlePlayer: function (e) {
        const video = document.getElementById('video');
        switch (e.keyCode) {
            case KEYS.BACK:
            case KEYS.RETURN:
                video.pause();
                video.src = '';
                if (this.hls) {
                    this.hls.destroy();
                    this.hls = null;
                }
                document.getElementById('player-container').style.display = 'none';
                clearInterval(this.playerInt);
                this.area = 'detail';
                break;
            case KEYS.ENTER:
                if (video.paused) video.play(); else video.pause();
                break;
            case KEYS.LEFT: video.currentTime -= 10; break;
            case KEYS.RIGHT: video.currentTime += 10; break;
        }
    },

    setupKeys: function () {
        document.addEventListener('keydown', (e) => this.handleKey(e));
    }
};

window.onload = () => App.init();
