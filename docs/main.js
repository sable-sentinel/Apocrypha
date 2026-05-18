$(document).ready(function () {
    const $mascot = $('.mascot');
    const $mascotText = $('.mascot-text');
    let hideTimeout;

    function showMascot(text) {
        if (!$mascot.is(':visible')) return;
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

    const $mascotDismiss = $('.mascot-dismiss');
    let promoTimeout;
    let promoActive = false;

    function clearPromo() {
        if (!promoActive) return;
        $('.footer-icon.promo-highlight').removeClass('promo-highlight');
        $mascot.removeClass('active');
        $mascotDismiss.removeClass('visible');
        promoActive = false;
        clearTimeout(promoTimeout);
    }

    function startPromo() {
        if (sessionStorage.getItem('promoDisabled') === 'true' || promoActive) return;
        const $icons = $('.footer-icon');
        if ($icons.length === 0) return;
        const $randomIcon = $icons.eq(Math.floor(Math.random() * $icons.length));
        const platform = $randomIcon.data('text') || 'Seek out more Seeker!';
        $randomIcon.addClass('promo-highlight');
        showMascot(platform);
        $mascotDismiss.addClass('visible');
        promoActive = true;
        promoTimeout = setTimeout(clearPromo, 8000);
    }

    $mascotDismiss.on('click', function(e) {
        e.stopPropagation();
        sessionStorage.setItem('promoDisabled', 'true');
        clearPromo();
    });

    $(document).on('mouseenter', '.footer-icon', function() {
        if (promoActive) {
            clearPromo();
        }
    });

    if ($('#intro-overlay').length) {
        const $overlay = $('#intro-overlay');
        const $skipIntro = $('#skip-intro');
        const $door = $('.compendia-door');
        let overlayVisible = true;

        const promoInterval = setInterval(function() {
            if (Math.random() < 0.1) {
                startPromo();
            }
        }, 30000);

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
                $('#search-input').focus();
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

    let lastScrollTop = 0;
    $(window).on('scroll', function() {
        if ($('.mobile-footer').length === 0) return;
        const st = $(window).scrollTop();
        if (st > lastScrollTop) {
            $('.mobile-footer').addClass('hide');
        } else {
            $('.mobile-footer').removeClass('hide');
        }
        lastScrollTop = st;
    });

    if ($('.book-container').length) {
        let maxPage = 0;
        $('#book-text-page-area p span[class*="page"]').each(function () {
            const classes = $(this).attr('class').split(/\s+/);
            classes.forEach(cls => {
                if (cls.startsWith('page')) {
                    const num = parseInt(cls.replace('page', ''));
                    if (!isNaN(num) && num > maxPage) maxPage = num;
                }
            });
        });
        const TOTAL_PAGES = maxPage > 0 ? maxPage : 1;
        const STORAGE_KEY = 'read_bookmarks';
        let bookmarks = [null, null, null, null, null];

        if (localStorage.getItem(STORAGE_KEY)) {
            try {
                bookmarks = JSON.parse(localStorage.getItem(STORAGE_KEY));
            } catch(e) {
                bookmarks = [null, null, null, null, null];
            }
        }
        let currentPageClass = 'page0';
        const $array = $('.bookmark-array');
        $array.empty();
        for (let i = 0; i < 5; i++) {
            $array.append(`<div class="bookmark-slot mascot-object" data-expression="default" data-text="Save current page with a bookmark." data-slot="${i}" title="Slot ${i+1}"></div>`);
        }
        $array.append(`<div class="bookmark-slot clear-bookmarks mascot-object" title="Clear Current Bookmark" data-expression="default" data-text="Clears the current active bookmark."></div>`);

        const $slots = $('.bookmark-slot').not('.clear-bookmarks');
        const $clearSlot = $('.clear-bookmarks');

        if (window.innerWidth <= 768) {
            const $header = $('#book-text-page-header');
            $array.addClass('mobile-header').prependTo($header);

            const $volSelect = $('<select class="volume-dropdown mascot-object" data-text="Select a volume."></select>');
            $volSelect.append('<option value="" disabled selected>Volume</option>');
            $('#volume-array .volume-slot a').each(function() {
                const volText = $(this).text();
                const volHref = $(this).attr('href');
                $volSelect.append(`<option value="${volHref}">${volText}</option>`);
            });
            $volSelect.on('change', function() {
                const href = $(this).val();
                if (href) window.location.href = href;
            });
            $header.append($volSelect);
        }

        function showPage(pageClass) {
            $('#book-text-page-area span[class*="page"]').removeClass('active-page');
            $('#book-text-page-area span.' + pageClass).addClass('active-page');

            const target = $('#book-text-page-area span.' + pageClass)[0];
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            $('#book-image-page img').removeClass('active-page');
            $('#book-image-page img.' + pageClass).addClass('active-page');
            $('.content-chapter').val(pageClass);
        }

        function goToPage(pageClass, keepOverlayHidden = false) {
            currentPageClass = pageClass;
            showPage(currentPageClass);
            if (!keepOverlayHidden) {
                $('.image-overlay').css('opacity', 1);
            }
            updateBookmarkUI();
        }

        function pageNumberFromClass(pageClass) {
            return parseInt(pageClass.replace('page', ''));
        }

        function saveBookmarks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks)); }
        function setBookmark(slot, pageClass) { bookmarks[slot] = pageClass; saveBookmarks(); }
        function clearBookmark(slot) { bookmarks[slot] = null; saveBookmarks(); }

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

        const CLICK_DELAY = 300;
        $slots.each(function () {
            const $slot = $(this);
            let clickTimer = null;
            $slot.on('click', function () {
                const slot = $slot.data('slot');
                if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
                clickTimer = setTimeout(function () {
                    clickTimer = null;
                    const saved = bookmarks[slot];
                    if (saved) { goToPage(saved); }
                    else { setBookmark(slot, currentPageClass); updateBookmarkUI(); }
                }, CLICK_DELAY);
            });
            $slot.on('dblclick', function () {
                if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
                const slot = $slot.data('slot');
                setBookmark(slot, currentPageClass);
                updateBookmarkUI();
            });
        });

        function clearCurrentPageBookmark() {
            for (let i = 0; i < 5; i++) {
                if (bookmarks[i] === currentPageClass) {
                    clearBookmark(i);
                    updateBookmarkUI();
                    return true;
                }
            }
            return false;
        }

        $clearSlot.on('click', function() {
            const cleared = clearCurrentPageBookmark();
            $(this).css('background-color', cleared ? '#c0392b' : '#95a5a6');
            setTimeout(() => $(this).css('background-color', ''), 200);
        });

        $(document).on('click', '.highlight', function(e) {
            e.stopPropagation();
            const $span = $(this).closest('span[class*="page"]');
            if (!$span.length) return;
            const spanClasses = $span.attr('class').split(/\s+/);
            let pageClass = '';
            spanClasses.forEach(cls => { if (cls.startsWith('page')) pageClass = cls; });
            if (!pageClass) return;
            if (pageClass === currentPageClass) {
                $('.image-overlay').css('opacity', 0);
            } else {
                goToPage(pageClass, true);
                $('.image-overlay').css('opacity', 0);
            }
        });

        $('#prev-page').on('click', function() {
            let num = pageNumberFromClass(currentPageClass);
            if (num > 0) goToPage('page' + (num - 1));
        });
        $('#next-page').on('click', function() {
            let num = pageNumberFromClass(currentPageClass);
            if (num < TOTAL_PAGES) goToPage('page' + (num + 1));
        });

        $('.content-chapter').on('change', function() {
            const val = $(this).val();
            if (val) goToPage(val);
        });

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
        
        goToPage('page0');
        updateBookmarkUI();
    }
});