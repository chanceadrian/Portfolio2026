document.querySelectorAll(".gallery").forEach((gallery) => {
  const scroller = gallery.querySelector(".scroll-container");
  const items = Array.from(gallery.querySelectorAll(".gallery-item"));
  const previousButton = gallery.querySelector(".gallery-button-previous");
  const nextButton = gallery.querySelector(".gallery-button-next");

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

  scroller.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);

  updateButtons();
});
