import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initScrollShowcase() {
  const items = gsap.utils.toArray(".scroll-item");
  const blurredBg = document.getElementById("blurredBg");

  // Set inicial
  items.forEach((el, i) => {
    if (i === 0) {
      gsap.set(el, {
        scale: 1,
        opacity: 1,
        x: 0,
        zIndex: 10,
      });
      const currentImg = el.querySelector("img");
      if (currentImg) {
        blurredBg.style.backgroundImage = `url(${currentImg.src})`;
      }
    } else if (i === 1) {
      gsap.set(el, {
        scale: 0.6,
        opacity: 0.5,
        x: 300,
        zIndex: 5,
      });
    } else {
      gsap.set(el, {
        scale: 0.4,
        opacity: 0,
        x: 600,
        zIndex: 0,
      });
    }
  });

  // Timeline + scrollTrigger
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: "#scrollShowcase",
      start: "top top",
      end: () => `+=${items.length * window.innerHeight * 1}`,
      scrub: true,
      pin: true,
    }
  });

  items.forEach((item, i) => {
    const currentImg = item.querySelector("img");
    timeline.to({}, {
      duration: 1,
      onUpdate: () => {
        items.forEach((el, j) => {
          if (j === i) {
            gsap.set(el, {
              scale: 1,
              opacity: 1,
              x: 0,
              zIndex: 10,
            });
            if (currentImg) {
              blurredBg.style.backgroundImage = `url(${currentImg.src})`;
            }
          } else if (j === i + 1) {
            gsap.set(el, {
              scale: 0.6,
              opacity: 0.5,
              x: 300,
              zIndex: 5,
            });
          } else {
            gsap.set(el, {
              scale: 0.4,
              opacity: 0,
              x: 600,
              zIndex: 0,
            });
          }
        });
      }
    });
  });
}
