$(document).ready(function () {
    const $mascot = $('.mascot');
    const $mascotText = $('.mascot-text');
    let hideTimeout;

    function showMascot(text) {
        $mascotText.text(text);
        $mascot.addClass('active');
    }

    $('body').on('mouseenter', '.mascot-object', function() {
        clearTimeout(hideTimeout);
        const txt = $(this).data('text') || '';
        const title = $(this).data('title') || '';
        showMascot(title + txt);
    });

    $('body').on('mouseleave', '.mascot-object', function() {
        hideTimeout = setTimeout(function() {
            $mascot.removeClass('active');
        }, 200);
    });

    let promoTimeout;
    let promoActive = false;

    function clearPromo() {
        if (!promoActive) return;
        $('.footer-icon.promo-highlight, .circle-icon.promo-highlight').removeClass('promo-highlight');
        $mascot.removeClass('active');
        promoActive = false;
        clearTimeout(promoTimeout);
    }

    function startPromo() {
        if ($(window).width() <= 768) return;
        const $icons = $('.footer-icon, .circle-icon');
        if ($icons.length === 0) return;
        const $randomIcon = $icons.eq(Math.floor(Math.random() * $icons.length));
        const platform = $randomIcon.data('text') || 'Seek out more Seeker!';
        $randomIcon.addClass('promo-highlight');
        showMascot(platform);
        promoActive = true;
        promoTimeout = setTimeout(clearPromo, 8000);
    }

    $(document).on('mouseenter', '.footer-icon, .circle-icon', function() {
        if (promoActive) {
            clearPromo();
        }
    });

    const promoInterval = setInterval(function() {
        if ($(window).width() > 768) {
            if (Math.random() < 0.1) {
                startPromo();
            }
        }
    }, 60000);

    // ========== GLOBAL BOOKMARK STORAGE ==========
    const BOOKMARK_STORAGE_KEY = 'apocrypha_bookmarks';
    const BOOKMARK_SLOTS_COUNT = 5;

    function getCurrentBookKey() {
        const path = window.location.pathname; // e.g. /books/kenshi-pacifier/index.html
        const parts = path.split('/').filter(Boolean);
        const booksIdx = parts.indexOf('books');
        if (booksIdx !== -1 && parts.length > booksIdx + 2 && parts[booksIdx + 2] === 'index.html') {
            return parts[booksIdx + 1];
        }
        // fallback: if the last segment is index.html, use the folder before it
        if (parts.length >= 2 && parts[parts.length - 1] === 'index.html') {
            return parts[parts.length - 2];
        }
        return 'default_book';
    }

    function collectAllBookKeys() {
        const keys = [];
        $('.home-book a').each(function() {
            const href = $(this).attr('href');
            if (href && href.includes('/books/')) {
                const parts = href.split('/');
                const booksIdx = parts.indexOf('books');
                if (booksIdx !== -1 && parts.length > booksIdx + 2 && parts[booksIdx + 2] === 'index.html') {
                    keys.push(parts[booksIdx + 1]);
                }
            }
        });
        return keys;
    }

    function rebuildBookmarkData() {
        const existing = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY) || '{}');
        const allKeys = collectAllBookKeys();
        allKeys.forEach(key => {
            if (!existing[key]) {
                existing[key] = new Array(BOOKMARK_SLOTS_COUNT).fill(null);
            } else if (!Array.isArray(existing[key]) || existing[key].length < BOOKMARK_SLOTS_COUNT) {
                // ensure array length
                const arr = existing[key] || [];
                while (arr.length < BOOKMARK_SLOTS_COUNT) arr.push(null);
                existing[key] = arr.slice(0, BOOKMARK_SLOTS_COUNT);
            }
        });
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(existing));
    }

    // rebuild bookmark data on home page
    if ($('.home-book').length) {
        rebuildBookmarkData();
    }

    // ========== INTRO OVERLAY LOGIC ==========
    if ($('#intro-overlay').length) {
        const $overlay = $('#intro-overlay');
        const $skipIntro = $('#skip-intro');
        const $door = $('.compendia-door');
        let overlayVisible = true;

        setTimeout(() => {
            if (overlayVisible) {
                showMascot('Welcome to Apocrypha Seeker!');
                setTimeout(() => $mascot.removeClass('active'), 8000);
            }
        }, 500);

        function dismissOverlay() {
            if (!overlayVisible) return;
            overlayVisible = false;
            clearInterval(promoInterval);
            clearPromo();

            $overlay.fadeOut(400, function() {
                $('body').addClass('browsing-active');
                randomizeShelfOrder();
                updateProgressBar();
            });
        }

        $skipIntro.on('click', function() {
            if (overlayVisible) dismissOverlay();
        });

        $door.on('click', function() {
            if (!overlayVisible) return;
            const door = $(this);
            if (door.hasClass('animating')) return;
            door.addClass('animating');
            door.css('pointer-events', 'none');
            let pulsed = false;

            const proceedToOpen = function() {
                if (pulsed) return;
                pulsed = true;
                door.removeClass('pulse');
                door.addClass('doors-opening');

                setTimeout(() => {
                    $overlay.addClass('transitioning');
                }, 500);

                setTimeout(() => {
                    dismissOverlay();
                }, 750);
            };
            const fallback = setTimeout(proceedToOpen, 350);

            door.one('animationend', function(e) {
                if (e.originalEvent.animationName !== 'doorPulse') return;
                clearTimeout(fallback);
                proceedToOpen();
            });

            door.addClass('pulse');
        });

        let selectedCategory = '';
        let searchQuery = '';

        function applyFilters() {
            $('.home-book').each(function() {
                const $book = $(this);
                const category = $book.data('category') || '';
                const text = $book.data('title') || $book.find('a').text() || '';
                const matchCategory = !selectedCategory || category === selectedCategory;
                const matchSearch = !searchQuery || text.toLowerCase().includes(searchQuery.toLowerCase());
                $(this).toggle(matchCategory && matchSearch);
            });
        }

        $('#category-filter').on('change', function() {
            selectedCategory = $(this).val();
            applyFilters();
        });

        $('#search-input').on('input', function() {
            searchQuery = $(this).val();
            applyFilters();
        });

        function randomizeShelfOrder() {
            const $shelf = $('.home-shelf');
            const $books = $shelf.children('.home-book').get();
            for (let i = $books.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [$books[i], $books[j]] = [$books[j], $books[i]];
            }
            $books.forEach(function(book) {
                $shelf.append(book);
            });
        }

        function updateProgressBar() {
            const total = $('.home-book').length;
            const completed = $('.home-book[data-book-status="complete"]').length;
            const $progress = $('#collection-progress');
            $progress.attr('max', total);
            $progress.attr('value', completed);
        }
    }

    // ========== READ PAGE LOGIC ==========
    if ($('.book-container').length) {
        let maxPage = 0;
        $('#book-text-page-area p[class*="page"]').each(function () {
            const classes = $(this).attr('class').split(/\s+/);
            classes.forEach(cls => {
                if (cls.startsWith('page')) {
                    const num = parseInt(cls.replace('page', ''));
                    if (!isNaN(num) && num > maxPage) maxPage = num;
                }
            });
        });
        const TOTAL_PAGES = maxPage > 0 ? maxPage : 1;

        // ----- Book-Specific Bookmark Loading -----
        const currentBookKey = getCurrentBookKey();
        let bookmarks = new Array(BOOKMARK_SLOTS_COUNT).fill(null);
        const storedData = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY) || '{}');
        if (storedData[currentBookKey] && Array.isArray(storedData[currentBookKey])) {
            bookmarks = storedData[currentBookKey].slice(0, BOOKMARK_SLOTS_COUNT);
        } else {
            storedData[currentBookKey] = bookmarks;
            localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(storedData));
        }

        let currentPageClass = 'page0';

        function buildBookmarkSlots($array) {
            $array.empty();
            for (let i = 0; i < BOOKMARK_SLOTS_COUNT; i++) {
                $array.append(`<div class="bookmark-slot mascot-object" data-text="Save the current page with a bookmark. Double-click to overwrite a saved bookmark with another page." data-slot="${i}" title="Slot ${i+1}"></div>`);
            }
            $array.append(`<div class="bookmark-slot clear-bookmarks mascot-object" title="Clear Current Bookmark" data-text="Clear the currently active bookmark."></div>`);
        }

        const $arrayDesktop = $('.bookmark-array').first();
        const $arrayMobile = $('.bookmark-array-mobile');
        buildBookmarkSlots($arrayDesktop);
        buildBookmarkSlots($arrayMobile);

        const $slots = $('.bookmark-slot').not('.clear-bookmarks');
        const $clearSlots = $('.clear-bookmarks');

        function saveBookmarksToStorage() {
            const allData = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY) || '{}');
            allData[currentBookKey] = bookmarks;
            localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(allData));
        }

        function setBookmark(slot, pageClass) {
            bookmarks[slot] = pageClass;
            saveBookmarksToStorage();
        }

        function clearBookmark(slot) {
            bookmarks[slot] = null;
            saveBookmarksToStorage();
        }

        function showPage(pageClass) {
            $('#book-text-page-area p[class*="page"]').removeClass('active-page');
            $('#book-text-page-area p.' + pageClass).addClass('active-page');

            $('#book-image-page img').removeClass('active-page');
            $('#book-image-page img.' + pageClass).addClass('active-page');

            $('.content-chapter').val(pageClass);
            $('.content-chapter-mobile').val(pageClass);
        }

        function goToPage(pageClass, keepOverlayHidden = false) {
            currentPageClass = pageClass;
            showPage(currentPageClass);
            if (!keepOverlayHidden) {
                $('.image-overlay').css('opacity', 1);
            }
            updateBookmarkUI();
            $('#book-image-page').removeClass('image-revealed');
            if($('#book-image-page').hasClass('blur-revealed')){
                toggleNsfw();
                $('#nsfw-toggle').addClass('active');
            }
        }

        function pageNumberFromClass(pageClass) {
            return parseInt(pageClass.replace('page', ''));
        }

        function updateBookmarkUI() {
            $slots.each(function() {
                const slot = $(this).data('slot');
                const saved = bookmarks[slot];
                const $slot = $(this);
                if (saved) {
                    $slot.addClass('has-bookmark');
                    $slot.attr('title', `Bookmark ${slot+1} (${saved})`);
                } else {
                    $slot.removeClass('has-bookmark');
                    $slot.attr('title', `Bookmark ${slot+1} (empty)`);
                }
                if (saved === currentPageClass) {
                    $slot.addClass('current-match');
                } else {
                    $slot.removeClass('current-match');
                }
            });
        }

        function isPageAlreadyBookmarked(pageClass) {
            return bookmarks.includes(pageClass);
        }

        function getBookmarkSlotForPage(pageClass) {
            return $slots.filter(function() {
                const slot = $(this).data('slot');
                return bookmarks[slot] === pageClass;
            });
        }

        const CLICK_DELAY = 300;
        $slots.each(function () {
            const $slot = $(this);
            let clickTimer = null;

            $slot.on('click', function () {
                const slot = $slot.data('slot');
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                }
                clickTimer = setTimeout(function () {
                    clickTimer = null;
                    const saved = bookmarks[slot];
                    if (saved) {
                        goToPage(saved);
                    } else {
                        if (isPageAlreadyBookmarked(currentPageClass)) {
                            const $existing = getBookmarkSlotForPage(currentPageClass);
                            if ($existing.length) {
                                $existing.addClass('duplicate-glow');
                                setTimeout(() => $existing.removeClass('duplicate-glow'), 1000);
                            }
                            return;
                        }
                        setBookmark(slot, currentPageClass);
                        updateBookmarkUI();
                    }
                }, CLICK_DELAY);
            });

            $slot.on('dblclick', function () {
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                }
                const slot = $slot.data('slot');
                if (isPageAlreadyBookmarked(currentPageClass)) {
                    const $existing = getBookmarkSlotForPage(currentPageClass);
                    if ($existing.length) {
                        $existing.addClass('duplicate-glow');
                        setTimeout(() => $existing.removeClass('duplicate-glow'), 1000);
                    }
                    return;
                }
                setBookmark(slot, currentPageClass);
                updateBookmarkUI();
            });
        });

        function clearCurrentPageBookmark() {
            for (let i = 0; i < BOOKMARK_SLOTS_COUNT; i++) {
                if (bookmarks[i] === currentPageClass) {
                    clearBookmark(i);
                    updateBookmarkUI();
                    return true;
                }
            }
            return false;
        }

        $clearSlots.on('click', function() {
            const cleared = clearCurrentPageBookmark();
            $(this).css('background-color', cleared ? '#c0392b' : '#95a5a6');
            setTimeout(() => $(this).css('background-color', ''), 200);
        });

        $(document).on('click', '.highlight', function(e) {
            e.stopPropagation();
            const $p = $(this).closest('p[class*="page"]');
            if (!$p.length) return;
            const classes = $p.attr('class').split(/\s+/);
            let pageClass = '';
            classes.forEach(cls => { if (cls.startsWith('page')) pageClass = cls; });
            if (!pageClass) return;

            if ($(window).width() <= 768) {
                if (pageClass !== currentPageClass) {
                    goToPage(pageClass, true);
                }
                $('#book-image-page').addClass('image-revealed');
                $('.image-overlay').css('opacity', 0);
            } else {
                if (pageClass === currentPageClass) {
                    $('.image-overlay').css('opacity', 0);
                } else {
                    goToPage(pageClass, true);
                    $('.image-overlay').css('opacity', 0);
                }
            }
        });

        // Close image on mobile
        $('.image-close-btn').on('click', function() {
            $('#book-image-page').removeClass('image-revealed');
        });

        // Swipe down to dismiss
        let imageTouchStartY = 0;
        $('#book-image-page').on('touchstart', function(e) {
            imageTouchStartY = e.originalEvent.touches[0].clientY;
        });
        $('#book-image-page').on('touchend', function(e) {
            const touchEndY = e.originalEvent.changedTouches[0].clientY;
            if (touchEndY - imageTouchStartY > 50) {
                $(this).removeClass('image-revealed');
            }
        });

        // Navigation buttons (desktop & mobile)
        $('#prev-page, #prev-page-mobile').on('click', function() {
            let num = pageNumberFromClass(currentPageClass);
            if (num > 0) goToPage('page' + (num - 1));
        });
        $('#next-page, #next-page-mobile').on('click', function() {
            let num = pageNumberFromClass(currentPageClass);
            if (num < TOTAL_PAGES) goToPage('page' + (num + 1));
        });

        // Chapter dropdowns
        $('.content-chapter, .content-chapter-mobile').on('change', function() {
            const val = $(this).val();
            if (val) goToPage(val);
        });

        // Keyboard arrows
        $(document).on('keydown', function(e) {
            if ($(e.target).is('input, textarea, select')) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                let num = pageNumberFromClass(currentPageClass);
                if (num > 0) goToPage('page' + (num - 1));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                let num = pageNumberFromClass(currentPageClass);
                if (num < TOTAL_PAGES) goToPage('page' + (num + 1));
            }
        });

        // Mobile volume dropdown
        $('#mobile-volume-select').on('change', function() {
            const url = $(this).val();
            if (url) {
                window.location.href = url;
            }
        });

        // Temporary tap effect on navigation and bookmark buttons
        const $tappableButtons = $('#prev-page, #next-page, #prev-page-mobile, #next-page-mobile');
        const $bookmarkSlots = $('.bookmark-slot');

        function applyTapEffect($el) {
            $el.addClass('tapped');
            setTimeout(() => {
                $el.removeClass('tapped');
            }, 1000);
        }

        $tappableButtons.on('click', function() {
            applyTapEffect($(this));
        });

        $bookmarkSlots.on('click', function() {
            applyTapEffect($(this));
        });

        // ========== NSFW TOGGLE ==========
        const $nsfwBtnDesktop = $('#nsfw-toggle');
        const $nsfwBtnMobile = $('#nsfw-toggle-mobile');
        const $imagePage = $('#book-image-page');

        $nsfwBtnDesktop.addClass('active');
        $nsfwBtnMobile.addClass('active');

        function toggleNsfw() {
            $imagePage.toggleClass('blur-revealed');
            $nsfwBtnDesktop.toggleClass('active');
            $nsfwBtnMobile.toggleClass('active');
        }

        $nsfwBtnDesktop.on('click', toggleNsfw);
        $nsfwBtnMobile.on('click', toggleNsfw);

        // Initial page load
        goToPage('page0');
        updateBookmarkUI();
    }
});