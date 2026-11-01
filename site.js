// Harvard IOP Policy Program: small behaviours shared by every page.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Section entrances: heading, then text, then picture
  var blocks = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    blocks.forEach(function (b) { b.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    blocks.forEach(function (b) { io.observe(b); });
    // Never leave content hidden if something goes wrong
    setTimeout(function () { blocks.forEach(function (b) { b.classList.add('in'); }); }, 4000);
  }

  // Our team: tap or press a portrait to read the bio
  document.querySelectorAll('.person-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var on = card.getAttribute('aria-pressed') === 'true';
      document.querySelectorAll('.person-card[aria-pressed="true"]').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      card.setAttribute('aria-pressed', on ? 'false' : 'true');
    });
  });

  // Briefs: filter by research team
  var filters = document.querySelectorAll('.filters button');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var team = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      document.querySelectorAll('.brief-item').forEach(function (item) {
        item.classList.toggle('is-hidden', team !== 'all' && item.getAttribute('data-team') !== team);
      });
      document.querySelectorAll('.year').forEach(function (y) {
        y.hidden = !y.querySelector('.brief-item:not(.is-hidden)');
      });
    });
  });

  // Contact: the form writes the memo our teams will read, then sends it
  var form = document.getElementById('proposal-form');
  if (!form) return;

  function val(name) {
    var el = form.elements[name];
    if (!el) return '';
    if (el.length && !el.tagName) {
      var picked = [];
      for (var i = 0; i < el.length; i++) if (el[i].checked) picked.push(el[i].value);
      return picked.join(', ');
    }
    return (el.value || '').trim();
  }
  function put(id, text, fallback) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || fallback;
    el.classList.toggle('empty', !text);
  }
  function render() {
    var who = [val('Contact name'), val('Title')].filter(Boolean).join(', ');
    var org = [val('Organization'), val('Level of government')].filter(Boolean).join(' (') + (val('Organization') && val('Level of government') ? ')' : '');
    put('pv-from', [who, org].filter(Boolean).join('\n'), 'Your name and office');
    put('pv-re', val('Topic'), 'The topic you would like studied');
    put('pv-team', val('Preferred team'), 'Any team');
    var parts = [];
    if (val('Question')) parts.push(val('Question'));
    if (val('How we could collaborate')) parts.push('How we could help: ' + val('How we could collaborate'));
    if (val('Timeline')) parts.push('Timing: ' + val('Timeline'));
    put('pv-body', parts.join('\n\n'), 'Describe the question in the form and it will appear here.');
  }
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  render();

  var status = document.getElementById('form-status');
  var submit = form.querySelector('[type="submit"]');
  form.addEventListener('submit', function (ev) {
    if (!window.fetch || !window.FormData) return; // plain POST still works
    ev.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = 'Sending topic…';
    status.hidden = true;
    fetch(form.getAttribute('data-ajax'), {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok && String(d.success) !== 'false', data: d }; });
    }).then(function (res) {
      if (!res.ok) throw new Error((res.data && res.data.message) || 'The form service did not accept the message.');
      status.className = 'form-status ok';
      status.textContent = 'Topic sent to policy@harvardiop.org. The board will follow up at ' + val('Email') + '.';
      status.hidden = false;
      form.reset();
      render();
      submit.textContent = 'Topic sent';
    }).catch(function (err) {
      status.className = 'form-status err';
      status.textContent = 'Your topic was not sent: ' + err.message + ' Try again, or email it to policy@harvardiop.org.';
      status.hidden = false;
      submit.disabled = false;
      submit.textContent = 'Send topic';
    });
  });
})();
