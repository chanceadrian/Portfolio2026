let activeGalleryController = null;

document.querySelectorAll(".gallery").forEach((gallery) => {
  const scroller = gallery.querySelector(".scroll-container");
  const items = Array.from(gallery.querySelectorAll(".gallery-item"));
  const previousButton = gallery.querySelector(".gallery-button-previous");
  const nextButton = gallery.querySelector(".gallery-button-next");
  const shelfCard = gallery.querySelector(".gallery-card-shelf");
  const indecisionCard = gallery.querySelector(".gallery-card-indecision");
  const dietaryCard = gallery.querySelector(".gallery-card-dietary");
  const indecisionStack = indecisionCard?.querySelector(".gallery-card-indecision-stack");
  const indecisionImage1 = indecisionCard?.querySelector(".gallery-card-indecision-image-1");
  const indecisionImage2 = indecisionCard?.querySelector(".gallery-card-indecision-image-2");
  const indecisionImage3 = indecisionCard?.querySelector(".gallery-card-indecision-image-3");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame = null;

  if (!scroller || items.length === 0 || !previousButton || !nextButton) {
    return;
  }

  const getCurrentIndex = () => {
    const leadingInset = parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0;
    const leadingEdge = scroller.scrollLeft + leadingInset;
    let closestIndex = 0;
    let closestDistance = Infinity;

    items.forEach((item, index) => {
      const distance = Math.abs(leadingEdge - item.offsetLeft);

      if (distance < closestDistance) {
        closestIndex = index;
        closestDistance = distance;
      }
    });

    return closestIndex;
  };

  const updateButtons = () => {
    const currentIndex = getCurrentIndex();

    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === items.length - 1;
  };

  const getApproachProgress = (card) => {
    const item = card.closest(".gallery-item");

    if (!item) {
      return 1;
    }

    const leadingInset = parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0;
    const leadingEdge = scroller.scrollLeft + leadingInset;
    const distanceBeforeSnap = item.offsetLeft - leadingEdge;

    return distanceBeforeSnap <= 0
      ? 1
      : Math.max(0, Math.min(1, 1 - distanceBeforeSnap / item.offsetWidth));
  };

  const updateGalleryMotion = () => {
    animationFrame = null;

    if (reduceMotion.matches) {
      return;
    }

    if (shelfCard) {
      const progress = getApproachProgress(shelfCard);
      const easedProgress = Math.pow(progress, 1.85);
      const shelfStyle = getComputedStyle(shelfCard);
      const finalOverlap = parseFloat(shelfStyle.getPropertyValue("--shelf-gallery-overlap")) || 64;
      const restingOverlap = parseFloat(shelfStyle.getPropertyValue("--shelf-gallery-overlap-resting")) || 24;
      const overlap = restingOverlap + ((finalOverlap - restingOverlap) * easedProgress);
      const drift = 18 * (1 - easedProgress);

      shelfCard.style.setProperty("--shelf-gallery-overlap-current", `${overlap.toFixed(2)}px`);
      shelfCard.style.setProperty("--shelf-gallery-drift", `${drift.toFixed(2)}px`);
    }

    if (indecisionCard && indecisionStack && indecisionImage1 && indecisionImage2 && indecisionImage3) {
      const progress = getApproachProgress(indecisionCard);
      const easedProgress = Math.pow(progress, 1.85);
      const stackWidth = indecisionStack.offsetWidth;
      const image1Centered = (stackWidth - indecisionImage1.offsetWidth) / 2;
      const image2Centered = (stackWidth - indecisionImage2.offsetWidth) / 2;
      const image3Centered = (stackWidth - indecisionImage3.offsetWidth) / 2;
      const image1Start = image1Centered;
      const image2Start = image2Centered;
      const image3Start = image3Centered;
      const image1End = stackWidth * 0.0054;
      const image2End = stackWidth * 0.319;
      const image3End = stackWidth * 0.6045;
      const image1Left = image1Start + ((image1End - image1Start) * easedProgress);
      const image2Left = image2Start + ((image2End - image2Start) * easedProgress);
      const image3Left = image3Start + ((image3End - image3Start) * easedProgress);

      indecisionCard.style.setProperty("--indecision-image-1-left", `${image1Left.toFixed(2)}px`);
      indecisionCard.style.setProperty("--indecision-image-2-left", `${image2Left.toFixed(2)}px`);
      indecisionCard.style.setProperty("--indecision-image-3-left", `${image3Left.toFixed(2)}px`);
    }

    if (dietaryCard) {
      const progress = getApproachProgress(dietaryCard);
      const easedProgress = Math.pow(progress, 1.85);
      const dietaryStyle = getComputedStyle(dietaryCard);
      const finalOverlap = parseFloat(dietaryStyle.getPropertyValue("--dietary-gallery-overlap")) || 340;
      const restingOverlap = parseFloat(dietaryStyle.getPropertyValue("--dietary-gallery-overlap-resting")) || 260;
      const overlap = restingOverlap + ((finalOverlap - restingOverlap) * easedProgress);

      dietaryCard.style.setProperty("--dietary-gallery-overlap-current", `${overlap.toFixed(2)}px`);
    }
  };

  const requestGalleryMotionUpdate = () => {
    if (animationFrame !== null) {
      return;
    }

    animationFrame = window.requestAnimationFrame(updateGalleryMotion);
  };

  const scrollToItem = (index) => {
    const item = items[Math.max(0, Math.min(index, items.length - 1))];
    const leadingInset = parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0;

    scroller.scrollTo({
      left: item.offsetLeft - leadingInset,
      behavior: "smooth",
    });
  };

  previousButton.addEventListener("click", () => {
    scrollToItem(getCurrentIndex() - 1);
  });

  nextButton.addEventListener("click", () => {
    scrollToItem(getCurrentIndex() + 1);
  });

  scroller.addEventListener("scroll", () => {
    updateButtons();
    requestGalleryMotionUpdate();
  }, { passive: true });

  window.addEventListener("resize", () => {
    updateButtons();
    requestGalleryMotionUpdate();
  });

  updateButtons();
  requestGalleryMotionUpdate();

  const controller = { scrollToItem, getCurrentIndex };

  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      activeGalleryController = controller;
    } else if (activeGalleryController === controller) {
      activeGalleryController = null;
    }
  }, { threshold: 0.3 }).observe(gallery);
});

document.addEventListener("keydown", (e) => {
  if (!activeGalleryController) return;
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  e.preventDefault();
  activeGalleryController.scrollToItem(
    activeGalleryController.getCurrentIndex() + (e.key === "ArrowRight" ? 1 : -1)
  );
});

// Segmented image viewer
document.querySelectorAll(".image-viewer").forEach((viewer) => {
  const [front, back] = Array.from(viewer.querySelectorAll(".image-frame-img"));
  const caption = viewer.querySelector(".viewer-caption");
  const indicator = viewer.querySelector(".segmented-indicator");
  const buttons = Array.from(viewer.querySelectorAll(".segmented-button"));
  let isFrontActive = true;

  // Initialize layer stack
  const initSelected = buttons.find((b) => b.classList.contains("is-selected"));
  if (initSelected && initSelected.dataset.image) {
    front.style.backgroundImage = `url('${initSelected.dataset.image}')`;
  }
  front.style.opacity = "1";
  front.style.zIndex = "1";
  back.style.opacity = "0";
  back.style.zIndex = "0";

  const positionIndicator = (button) => {
    if (!indicator || !button) return;
    indicator.style.left = `${button.offsetLeft}px`;
    indicator.style.width = `${button.offsetWidth}px`;
  };

  const selectButton = (button) => {
    if (button.classList.contains("is-selected")) return;

    buttons.forEach((b) => b.classList.remove("is-selected"));
    button.classList.add("is-selected");
    positionIndicator(button);

    const newSrc = button.dataset.image;
    const newCaption = button.dataset.caption;

    if (newSrc) {
      const incoming = isFrontActive ? back : front;
      const outgoing = isFrontActive ? front : back;

      const doFade = () => {
        incoming.style.backgroundImage = `url('${newSrc}')`;
        incoming.style.zIndex = "1";
        outgoing.style.zIndex = "0";
        requestAnimationFrame(() => {
          incoming.style.opacity = "1";
          outgoing.style.opacity = "0";
          isFrontActive = !isFrontActive;
        });
      };

      const preloader = new Image();
      preloader.src = newSrc;
      if (preloader.complete && preloader.naturalWidth > 0) doFade();
      else preloader.onload = doFade;
    }

    if (caption && newCaption) {
      caption.classList.add("is-transitioning");
      setTimeout(() => {
        caption.textContent = newCaption;
        caption.classList.remove("is-transitioning");
      }, 180);
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => selectButton(button));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const currentIndex = buttons.findIndex((b) => b.classList.contains("is-selected"));
    if (currentIndex === -1) return;
    const nextIndex = e.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
    const nextButton = buttons[nextIndex];
    if (nextButton) selectButton(nextButton);
  });

  // Set indicator position on load without animation, then restore transition
  requestAnimationFrame(() => {
    const selected = buttons.find((b) => b.classList.contains("is-selected"));
    if (selected && indicator) {
      indicator.style.transition = "none";
      positionIndicator(selected);
      requestAnimationFrame(() => {
        indicator.style.transition = "";
      });
    }
  });

  window.addEventListener("resize", () => {
    const selected = buttons.find((b) => b.classList.contains("is-selected"));
    if (selected) positionIndicator(selected);
  });
});

// NASA Anomaly scroll reveal
const anomalyGroup = document.querySelector('.anomaly-image-group');
const anomalySection = document.querySelector('.nasa-anomaly-section');

if (anomalyGroup && anomalySection) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduceMotion.matches) {
    anomalyGroup.classList.add('is-visible');
  } else {
    let hasBeenVisible = false;

    const anomalyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          hasBeenVisible = true;
          anomalyGroup.classList.remove('is-exiting');
          anomalyGroup.classList.add('is-visible');
        } else if (hasBeenVisible && entry.boundingClientRect.top > 0) {
          anomalyGroup.classList.remove('is-visible');
          anomalyGroup.classList.add('is-exiting');
        }
      });
    }, { threshold: 0.6, rootMargin: '0px 0px -80px 0px' });

    anomalyObserver.observe(anomalySection);
  }
}

// NASA gallery parallax
const nasaGallerySection = document.querySelector(".nasa-gallery-section");
const nasaGalleryImage = nasaGallerySection?.querySelector(".nasa-gallery-image");

if (nasaGallerySection && nasaGalleryImage) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const updateParallax = () => {
    if (reduceMotion.matches) return;
    const rect = nasaGallerySection.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const offset = (sectionCenter - viewportCenter) * 0.22;
    nasaGalleryImage.style.transform = `translateY(${offset.toFixed(2)}px)`;
  };

  window.addEventListener("scroll", updateParallax, { passive: true });
  updateParallax();
}

// Shelf items gallery
const shelfItemsSection = document.querySelector(".shelf-items-section");

if (shelfItemsSection) {
  const images = Array.from(shelfItemsSection.querySelectorAll(".shelf-gallery-img"));
  const rows = Array.from(shelfItemsSection.querySelectorAll(".shelf-item-row"));
  const prevBtn = shelfItemsSection.querySelector(".gallery-button-previous");
  const nextBtn = shelfItemsSection.querySelector(".gallery-button-next");
  const STEP = 406;
  let currentIndex = 0;

  const updatePositions = (newIndex) => {
    images.forEach((img, i) => {
      const offset = i - newIndex;
      let x, opacity, scale;

      if (offset === 0) {
        x = 0; opacity = 1; scale = 1;
      } else if (offset < 0) {
        x = 0; opacity = 0; scale = 0.92;
      } else {
        x = offset * STEP;
        opacity = offset <= 2 ? 1 : 0;
        scale = 1;
      }

      img.style.setProperty("--shelf-img-opacity", opacity);
      img.style.setProperty("--shelf-img-x", `${x}px`);
      img.style.setProperty("--shelf-img-scale", scale);
      img.style.zIndex = offset === 0 ? 2 : 1;
    });

    rows.forEach((row) => row.classList.remove("is-selected"));
    rows[newIndex]?.classList.add("is-selected");
    currentIndex = newIndex;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === images.length - 1;
  };

  // Set initial positions without transition flash
  images.forEach((img) => { img.style.transition = "none"; });
  updatePositions(0);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      images.forEach((img) => { img.style.transition = ""; });
    });
  });

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) updatePositions(currentIndex - 1);
  });
  nextBtn.addEventListener("click", () => {
    if (currentIndex < images.length - 1) updatePositions(currentIndex + 1);
  });
  rows.forEach((row) => {
    row.addEventListener("click", () => {
      const index = parseInt(row.dataset.index, 10);
      if (!isNaN(index)) updatePositions(index);
    });
  });

  // Trackpad / horizontal scroll wheel
  let wheelAccum = 0;
  let wheelCooldown = false;

  shelfItemsSection.addEventListener("wheel", (e) => {
    if (wheelCooldown) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    wheelAccum += e.deltaX;
    if (Math.abs(wheelAccum) >= 50) {
      const next = currentIndex + (wheelAccum > 0 ? 1 : -1);
      if (next >= 0 && next < images.length) updatePositions(next);
      wheelAccum = 0;
      wheelCooldown = true;
      setTimeout(() => { wheelCooldown = false; }, 750);
    }
  }, { passive: false });

  // Touch swipe
  let touchStartX = null;

  shelfItemsSection.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  shelfItemsSection.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 60) return;
    const next = currentIndex + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < images.length) updatePositions(next);
  }, { passive: true });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const rect = shelfItemsSection.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const next = currentIndex + (e.key === "ArrowRight" ? 1 : -1);
    if (next >= 0 && next < images.length) updatePositions(next);
  });
}

// Shelf Style reveal
const shelfStyleImages = document.querySelector(".shelf-style-images");
const shelfStyleSection = document.querySelector(".shelf-style-section");

if (shelfStyleImages && shelfStyleSection) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    shelfStyleImages.classList.add("is-visible");
  } else {
    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) shelfStyleImages.classList.add("is-visible");
    // Increase rootMargin bottom offset (more negative = triggers later/deeper into scroll)
    }, { threshold: 0, rootMargin: "0px 0px -85% 0px" }).observe(shelfStyleSection);
  }
}

// Shelf Spaces & Rooms
const shelfSpacesSection = document.querySelector(".shelf-spaces-section");

if (shelfSpacesSection) {
  const [bgFront, bgBack] = shelfSpacesSection.querySelectorAll(".shelf-spaces-bg-img");
  const imageGroup = shelfSpacesSection.querySelector(".shelf-spaces-image-group");
  const itemsClip = shelfSpacesSection.querySelector(".shelf-spaces-items-clip");
  const darken = shelfSpacesSection.querySelector(".shelf-spaces-darken");
  const sheetClip = shelfSpacesSection.querySelector(".shelf-spaces-sheet-clip");
  const prevBtn = shelfSpacesSection.querySelector(".shelf-spaces-side-prev .gallery-button");
  const nextBtn = shelfSpacesSection.querySelector(".shelf-spaces-side-next .gallery-button");
  const segButtons = Array.from(shelfSpacesSection.querySelectorAll(".segmented-button"));
  const indicator = shelfSpacesSection.querySelector(".segmented-indicator");
  const caption = shelfSpacesSection.querySelector(".shelf-spaces-caption");

  const ITEM_W = 375.38;
  const BG_SRCS = [
    "assets/images/Shelf/space-1.avif",
    "assets/images/Shelf/space-2.avif",
    "assets/images/Shelf/space-3.avif",
  ];
  const CAPTIONS = [
    "Placeholder caption for Spaces, sp-1.",
    "Placeholder caption for Spaces, sp-2.",
    "Placeholder caption for Spaces, sp-3.",
    "Placeholder caption for Rooms.",
  ];

  let spaceIdx = 0;
  let isRoom = false;
  let isBgFrontActive = true;
  let lastBgIdx = 0;

  ["space-2.avif", "space-3.avif"].forEach((n) => { new Image().src = `assets/images/Shelf/${n}`; });

  const positionIndicator = (btn) => {
    if (!indicator || !btn) return;
    const trackRect = indicator.parentElement.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    indicator.style.left = `${btnRect.left - trackRect.left}px`;
    indicator.style.width = `${btnRect.width}px`;
  };

  const crossfadeBg = (idx) => {
    if (idx === lastBgIdx) return;
    lastBgIdx = idx;
    const incoming = isBgFrontActive ? bgBack : bgFront;
    const outgoing = isBgFrontActive ? bgFront : bgBack;
    const doFade = () => {
      incoming.style.backgroundImage = `url('${BG_SRCS[idx]}')`;
      incoming.style.zIndex = "1";
      outgoing.style.zIndex = "0";
      requestAnimationFrame(() => {
        incoming.style.opacity = "1";
        outgoing.style.opacity = "0";
        isBgFrontActive = !isBgFrontActive;
      });
    };
    const preloader = new Image();
    preloader.src = BG_SRCS[idx];
    if (preloader.complete && preloader.naturalWidth > 0) doFade();
    else preloader.onload = doFade;
  };

  let currentCaptionText = "";
  const setCaption = (text) => {
    if (!caption || text === currentCaptionText) return;
    currentCaptionText = text;
    caption.classList.add("is-transitioning");
    setTimeout(() => {
      caption.textContent = text;
      caption.classList.remove("is-transitioning");
    }, 180);
  };

  let roomExitTimer = null;

  const enterRoom = () => {
    if (isRoom) return;
    isRoom = true;
    clearTimeout(roomExitTimer);
    spaceIdx = 2;
    itemsClip.scrollTo({ left: 2 * ITEM_W, behavior: "smooth" });
    crossfadeBg(2);
    darken.style.opacity = "1";
    darken.style.pointerEvents = "auto";
    imageGroup.classList.add("is-room");
    sheetClip.classList.add("is-room");
    segButtons.forEach((btn, i) => btn.classList.toggle("is-selected", i === 1));
    positionIndicator(segButtons[1]);
    setCaption(CAPTIONS[3]);
    prevBtn.disabled = false;
    nextBtn.disabled = true;
  };

  const exitRoom = () => {
    if (!isRoom) return;
    isRoom = false;
    darken.style.opacity = "0";
    darken.style.pointerEvents = "none";
    sheetClip.classList.remove("is-room");
    clearTimeout(roomExitTimer);
    roomExitTimer = setTimeout(() => imageGroup.classList.remove("is-room"), 620);
    segButtons.forEach((btn, i) => btn.classList.toggle("is-selected", i === 0));
    positionIndicator(segButtons[0]);
    setCaption(CAPTIONS[spaceIdx]);
    prevBtn.disabled = spaceIdx === 0;
    nextBtn.disabled = false;
  };

  const goToSpace = (idx) => {
    idx = Math.max(0, Math.min(2, idx));
    if (isRoom) exitRoom();
    spaceIdx = idx;
    crossfadeBg(idx);
    itemsClip.scrollTo({ left: idx * ITEM_W, behavior: "smooth" });
    setCaption(CAPTIONS[idx]);
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = false;
  };

  // Live background crossfade as user drags items
  let scrollBgIdx = 0;
  let settleTimer = null;

  itemsClip.addEventListener("scroll", () => {
    if (isRoom) return;
    const bgIdx = Math.min(2, Math.round(itemsClip.scrollLeft / ITEM_W));
    if (bgIdx !== scrollBgIdx) {
      scrollBgIdx = bgIdx;
      crossfadeBg(bgIdx);
    }
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      spaceIdx = Math.min(2, Math.round(itemsClip.scrollLeft / ITEM_W));
      prevBtn.disabled = spaceIdx === 0;
      setCaption(CAPTIONS[spaceIdx]);
    }, 150);
  }, { passive: true });

  // Swipe past last item → room
  let spTouchX = null;
  let spTouchScrollLeft = null;

  itemsClip.addEventListener("touchstart", (e) => {
    spTouchX = e.touches[0].clientX;
    spTouchScrollLeft = itemsClip.scrollLeft;
  }, { passive: true });

  itemsClip.addEventListener("touchend", (e) => {
    if (spTouchX === null) return;
    const dx = e.changedTouches[0].clientX - spTouchX;
    const wasAtEnd = spTouchScrollLeft >= (2 * ITEM_W - 8);
    spTouchX = null;
    spTouchScrollLeft = null;
    if (dx < -50 && wasAtEnd && !isRoom) enterRoom();
  }, { passive: true });

  prevBtn.addEventListener("click", () => {
    if (isRoom) exitRoom();
    else goToSpace(spaceIdx - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (isRoom) return;
    if (spaceIdx >= 2) enterRoom();
    else goToSpace(spaceIdx + 1);
  });

  segButtons[0].addEventListener("click", () => { if (isRoom) exitRoom(); });
  segButtons[1].addEventListener("click", () => { if (!isRoom) enterRoom(); });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const rect = shelfSpacesSection.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    e.preventDefault();
    if (e.key === "ArrowLeft") {
      if (isRoom) exitRoom();
      else goToSpace(spaceIdx - 1);
    } else {
      if (isRoom) return;
      if (spaceIdx >= 2) enterRoom();
      else goToSpace(spaceIdx + 1);
    }
  });

  // Initialize
  bgFront.style.backgroundImage = `url('${BG_SRCS[0]}')`;
  currentCaptionText = CAPTIONS[0];
  bgFront.style.opacity = "1";
  bgFront.style.zIndex = "1";
  bgBack.style.opacity = "0";
  bgBack.style.zIndex = "0";
  darken.style.opacity = "0";
  darken.style.pointerEvents = "none";
  itemsClip.scrollLeft = 0;
  prevBtn.disabled = true;
  nextBtn.disabled = false;

  requestAnimationFrame(() => {
    indicator.style.transition = "none";
    positionIndicator(segButtons[0]);
    requestAnimationFrame(() => { indicator.style.transition = ""; });
  });
}
