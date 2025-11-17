// public/js/carousel.js

document.addEventListener('DOMContentLoaded', function() {
  const carousel = document.getElementById('promoCarousel');
  if (carousel) {
    const slides = carousel.querySelectorAll('.promo-slide');
    const dotsContainer = document.getElementById('promoDots');
    let currentSlide = 0;

    // Create dots
    if (dotsContainer) {
      slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('promo-dot');
        dot.addEventListener('click', () => showSlide(index));
        dotsContainer.appendChild(dot);
      });
    }
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.promo-dot') : [];

    function showSlide(index) {
      slides.forEach(slide => slide.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));
      slides[index].classList.add('active');
      if (dots[index]) {
        dots[index].classList.add('active');
      }
      currentSlide = index;
    }

    function nextSlide() {
      let next = (currentSlide + 1) % slides.length;
      showSlide(next);
    }

    // Initial show
    if (slides.length > 0) {
      showSlide(0);
    }

    // Autoplay
    if (carousel.dataset.autoplay === 'true') {
      setInterval(nextSlide, 5000); // 5-second interval
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      // Toggle the 'active' class on the clicked item
      item.classList.toggle('active');

      // Close other open items
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
        }
      });
    });
  });
});