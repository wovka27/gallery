const GalleryClassList = {
  container: "gallery",
  line: "gallery-line",
  slide: "gallery-slide",
  dots: "gallery-pagination",
  dot: "gallery-dot",
  dot_active: "gallery-dot-active",
  nav: "gallery-nav",
  btn_left: "gallery-nav-left",
  btn_right: "gallery-nav-right",
};

class Gallery {
  constructor(element, option = {}) {
    this.containerNode = element;
    this.size = element.childElementCount;
    this.currentSlide = 0;
    this.currentSlideWasChanged = false;
    this.setting = {
      margin: option.margin || 0,
      countShow: option.countShow || 1,
      countScroll: option.countScroll || 1,
      wheel: option.wheel || false,
      dots: option.dots || false,
      nav: option.nav || false,
    };
    this.dotsCount = this.size + 1 - this.setting.countShow;
    this.arrowRight = `
      <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      width="451.846px" height="451.847px" viewBox="0 0 451.846 451.847" style="enable-background:new 0 0 451.846 451.847;"
      xml:space="preserve">
        <g>
          <path d="M345.441,248.292L151.154,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744
            L278.318,225.92L106.409,54.017c-12.354-12.359-12.354-32.394,0-44.748c12.354-12.359,32.391-12.359,44.75,0l194.287,194.284
            c6.177,6.18,9.262,14.271,9.262,22.366C354.708,234.018,351.617,242.115,345.441,248.292z"/>
        </g>
      </svg>
    `;
    this.arrowLeft = `
      <?xml version="1.0" encoding="iso-8859-1"?>
      <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 492 492" style="enable-background:new 0 0 492 492;" xml:space="preserve">
          <g>
            <g>
              <path d="M198.608,246.104L382.664,62.04c5.068-5.056,7.856-11.816,7.856-19.024c0-7.212-2.788-13.968-7.856-19.032l-16.128-16.12
                C361.476,2.792,354.712,0,347.504,0s-13.964,2.792-19.028,7.864L109.328,227.008c-5.084,5.08-7.868,11.868-7.848,19.084
                c-0.02,7.248,2.76,14.028,7.848,19.112l218.944,218.932c5.064,5.072,11.82,7.864,19.032,7.864c7.208,0,13.964-2.792,19.032-7.864
                l16.124-16.12c10.492-10.492,10.492-27.572,0-38.06L198.608,246.104z"/>
            </g>
          </g>
      </svg>
    `;
    this.manageHTML = this.manageHTML.bind(this);
    this.setParams = this.setParams.bind(this);
    this.setEvents = this.setEvents.bind(this);
    this.resizeGallery = this.resizeGallery.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
    this.dragging = this.dragging.bind(this);
    this.setStylePosition = this.setStylePosition.bind(this);
    this.clickDots = this.clickDots.bind(this);
    this.moveToLeft = this.moveToLeft.bind(this);
    this.moveToRight = this.moveToRight.bind(this);
    this.changeCurrentSlide = this.changeCurrentSlide.bind(this);
    this.changeActiveDotClass = this.changeActiveDotClass.bind(this);
    this.scrollWheel = this.scrollWheel.bind(this);

    this.manageHTML();
    this.setParams();
    this.setEvents();
  }

  manageHTML() {
    this.containerNode.classList.add(GalleryClassList.container);
    this.containerNode.innerHTML = `
      <div class="${GalleryClassList.line}">${this.containerNode.innerHTML}</div>
    `;
    if (this.setting.dots) {
      this.containerNode.insertAdjacentHTML(
        "beforeend",
        `<div class="${GalleryClassList.dots}"></div>`
      );
    }
    if (this.setting.nav) {
      this.containerNode.insertAdjacentHTML(
        "beforeend",
        `
        <span class="${GalleryClassList.btn_left}"> ${this.arrowLeft} </span>
        <span class="${GalleryClassList.btn_right}"> ${this.arrowRight} </span>
      `
      );
    }

    this.lineNode = this.containerNode.querySelector(
      `.${GalleryClassList.line}`
    );
    this.dotsNode = this.containerNode.querySelector(
      `.${GalleryClassList.dots}`
    );
    this.slideNodes = Array.from(this.lineNode.children).map((childNode) =>
      wrapElementByDiv({
        element: childNode,
        className: GalleryClassList.slide,
      })
    );
    if (this.setting.dots) {
      this.dotsNode.innerHTML = Array.from(Array(this.dotsCount).keys())
        .map(
          (key) =>
            `<span class="${GalleryClassList.dot} ${
              key === this.currentSlide ? GalleryClassList.dot_active : ""
            }"></span>`
        )
        .join("");
      this.dotNodes = this.dotsNode.querySelectorAll(
        `.${GalleryClassList.dot}`
      );
    }
    if (this.setting.nav) {
      this.navLeft = this.containerNode.querySelector(
        `.${GalleryClassList.btn_left}`
      );
      this.navRight = this.containerNode.querySelector(
        `.${GalleryClassList.btn_right}`
      );
    }
  }
  setParams() {
    const coordsContainer = this.containerNode.getBoundingClientRect();
    this.width =
      coordsContainer.width / this.setting.countShow - this.setting.margin;
    this.maximumX = -this.dotsCount * (this.width + this.setting.margin);
    this.x = this.currentSlide * (this.width + this.setting.margin);
    this.lineNode.style.width = `${
      this.size * (this.width + this.setting.margin)
    }px`;
    this.resetStyleTransition();
    this.setStylePosition();
    Array.from(this.slideNodes).forEach((slideNode) => {
      slideNode.style.width = `${this.width}px`;
      slideNode.style.marginLeft = `${this.setting.margin}px`;
      slideNode.style.marginRight = `${this.setting.margin}px`;
    });
  }
  setEvents() {
    window.addEventListener("resize", this.resizeGallery);
    window.addEventListener("change", this.resizeGallery);
    this.lineNode.addEventListener("mousedown", this.startDrag);
    this.lineNode.addEventListener("mouseup", this.stopDrag);
    this.lineNode.addEventListener("touchstart", this.startDrag);
    this.lineNode.addEventListener("touchend", this.stopDrag);
    if (this.setting.wheel) {
      this.lineNode.addEventListener("wheel", this.scrollWheel);
    }
    if (this.setting.dots) {
      this.dotsNode.addEventListener("click", this.clickDots);
    }
    if (this.setting.nav) {
      this.navRight.addEventListener("click", this.moveToRight);
      this.navLeft.addEventListener("click", this.moveToLeft);
    }
  }
  destroyEvents() {
    window.removeEventListener("resize", this.resizeGallery);
    this.lineNode.removeEventListener("mousedown", this.startDrag);
    this.lineNode.removeEventListener("mouseup", this.stopDrag);
    this.lineNode.removeEventListener("touchstart", this.startDrag);
    this.lineNode.removeEventListener("touchend", this.stopDrag);
    this.dotsNode.removeEventListener("click", this.clickDots);
    this.navRight.removeEventListener("click", this.moveToRight);
    this.navLeft.removeEventListener("click", this.moveToLeft);
  }

  resizeGallery() {
    this.setParams();
  }

  startDrag(evt) {
    this.currentSlideWasChanged = false;
    this.clickX = evt.clientX || evt.touches[0].clientX;
    this.startX = this.x;
    window.addEventListener("mousemove", this.dragging);
    window.addEventListener("touchmove", this.dragging);
    this.resetStyleTransition();
  }
  stopDrag() {
    window.removeEventListener("mousemove", this.dragging);
    window.removeEventListener("touchmove", this.dragging);
    this.changeCurrentSlide();
  }
  dragging(evt) {
    this.dragX = evt.clientX || evt.touches[0].clientX;
    const dragShift = this.dragX - this.clickX;
    const easing = dragShift / 50;
    this.x = Math.max(
      Math.min(this.startX + dragShift, easing),
      this.maximumX + easing
    );
    this.setStylePosition();

    if (
      dragShift > this.width / 3 &&
      dragShift > 0 &&
      !this.currentSlideWasChanged &&
      this.currentSlide > 0
    ) {
      this.currentSlideWasChanged = true;
      this.currentSlide -= 1;
    }

    if (
      dragShift < -(this.width / 3) &&
      dragShift < 0 &&
      !this.currentSlideWasChanged &&
      this.currentSlide < this.size - this.setting.countShow
    ) {
      this.currentSlideWasChanged = true;
      this.currentSlide += 1;
    }
  }
  clickDots(evt) {
    const dotNode = evt.target.closest("span");
    if (!dotNode) return;
    let dotNum;
    for (let i = 0; i < this.dotNodes.length; i++) {
      if (this.dotNodes[i] === dotNode) {
        dotNum = i;
        break;
      }
    }
    if (dotNum === this.currentSlide) return;

    const countSwipes = Math.abs(this.currentSlide - dotNum);
    this.currentSlide = dotNum;
    this.changeCurrentSlide(countSwipes);
  }

  moveToLeft() {
    this.currentSlide <= 0
      ? (this.currentSlide = this.size - this.setting.countShow)
      : (this.currentSlide -= 1);
    this.changeCurrentSlide();
  }

  moveToRight() {
    this.currentSlide >= this.size - this.setting.countShow
      ? (this.currentSlide = 0)
      : (this.currentSlide += 1);
    this.changeCurrentSlide();
  }

  changeCurrentSlide(countSwipes) {
    this.x = -this.currentSlide * (this.width + this.setting.margin);
    this.setStylePosition(countSwipes);
    this.setStyleTransition();
    this.setting.dots ? this.changeActiveDotClass() : 0;
  }

  scrollWheel(evt) {
    evt.wheelDelta < 0 ? this.moveToRight() : this.moveToLeft();
  }

  changeActiveDotClass() {
    for (let i = 0; i < this.dotNodes.length; i++) {
      this.dotNodes[i].classList.remove(GalleryClassList.dot_active);
    }
    this.dotNodes[this.currentSlide].classList.add(GalleryClassList.dot_active);
  }

  setStylePosition() {
    this.lineNode.style.transform = `translate3d(${this.x}px, 0, 0)`;
  }

  setStyleTransition(countSwipes = 1) {
    this.lineNode.style.transition = `all ${0.5 * countSwipes}s ease 0s`;
  }

  resetStyleTransition() {
    this.lineNode.style.transition = "all 0s ease 0s";
  }
}

function wrapElementByDiv({ element, className }) {
  const wrapperNode = document.createElement("div");
  wrapperNode.classList.add(className);

  element.parentNode.insertBefore(wrapperNode, element);
  wrapperNode.appendChild(element);

  return wrapperNode;
}

function debounce(func, time = 100) {
  let timer;
  return function (event) {
    clearTimeout(timer);
    timer = setTimeout(func, time, event);
  };
}
