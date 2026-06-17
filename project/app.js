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
    const submitButton = leadForm.querySelector('button[type="submit"]');
    const status = leadForm.querySelector('[data-lead-status]');
    const originalButtonHtml = submitButton ? submitButton.innerHTML : '';

    const setStatus = (type, message) => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = type;
    };

    const mailtoFallback = (data) => {
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
      window.open(`mailto:upgrade-hmao@yandex.ru?subject=${subject}&body=${mailBody}`, '_blank');
    };

    leadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(leadForm);

      const payload = Object.fromEntries(data.entries());
      payload.page = window.location.href;
      payload.referrer = document.referrer;
      payload.utm = Object.fromEntries(
        Array.from(new URLSearchParams(window.location.search).entries()).filter(([key]) => key.startsWith('utm_')),
      );

      leadForm.classList.add('is-sending');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Отправляем...';
      }
      setStatus('pending', 'Отправляем заявку...');

      try {
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (result.code === 'NO_DELIVERY_CHANNELS') {
            mailtoFallback(data);
          }
          throw new Error(result.error || 'Не удалось отправить заявку.');
        }

        window.location.href = 'thanks.html';
      } catch (error) {
        setStatus('error', error.message || 'Не удалось отправить заявку. Напишите в Telegram @ilhom_upgrade.');
        leadForm.classList.remove('is-sending');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonHtml;
        }
      }
    });
  }
})();
