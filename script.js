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
});
