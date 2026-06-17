(() => {
  const burger = document.getElementById('burger');
  const mmenu = document.getElementById('mmenu');

  if (burger && mmenu) {
    const setOpen = (open) => {
      burger.classList.toggle('open', open);
      mmenu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      mmenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    burger.addEventListener('click', () => setOpen(!mmenu.classList.contains('open')));
    mmenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  let ticking = false;

  const checkReveal = () => {
    ticking = false;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    for (let i = revealEls.length - 1; i >= 0; i -= 1) {
      const el = revealEls[i];
      if (el.getBoundingClientRect().top < vh * 0.92) {
        el.classList.add('in');
        revealEls.splice(i, 1);
      }
    }

    if (revealEls.length === 0) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  };

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(checkReveal);
    }
  }

  if (revealEls.length > 0) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    checkReveal();
    setTimeout(() => revealEls.forEach((el) => el.classList.add('in')), 2500);
  }

  const leadForm = document.querySelector('[data-lead-form]');
  if (leadForm) {
    leadForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(leadForm);
      const body = [
        'Новая заявка на курс «ИИ для карьеры 2026»',
        '',
        `Имя: ${data.get('name') || ''}`,
        `Контакт: ${data.get('contact') || ''}`,
        `Формат: ${data.get('format') || ''}`,
        `Задача: ${data.get('message') || ''}`,
      ].join('\n');

      const subject = encodeURIComponent('Заявка на курс ИИ для карьеры 2026');
      const mailBody = encodeURIComponent(body);
      window.location.href = `mailto:upgrade-hmao@yandex.ru?subject=${subject}&body=${mailBody}`;
    });
  }
})();
