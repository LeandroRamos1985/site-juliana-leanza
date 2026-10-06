(function () {
  'use strict';
  var WA = '5521997998736';
  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  window.dataLayer = window.dataLayer || [];
  function track(name, p) { p = p || {}; p.event = name; window.dataLayer.push(p); }

  /* origem da campanha: so utm_source/medium/campaign, nunca dados pessoais */
  var origem = '';
  try {
    var q = new URLSearchParams(location.search), s = q.get('utm_source');
    if (s) { store.set('jl_origem', [s, q.get('utm_medium'), q.get('utm_campaign')].filter(Boolean).join(' / ').replace(/[^\w \/.-]/g, '').slice(0, 80)); }
    origem = store.get('jl_origem') || '';
  } catch (e) {}
  function wa(msg) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg + (origem ? '\n(Origem: ' + origem + ')' : '')); }

  var padrao = 'Olá, Juliana! Vim pelo site e gostaria de agendar uma consulta.';
  Array.prototype.forEach.call(document.querySelectorAll('[data-wa]'), function (a) {
    a.href = wa(padrao); a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', function () { track('whatsapp_click', { local: a.getAttribute('data-wa') }); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-ev]'), function (a) {
    a.addEventListener('click', function () { track(a.getAttribute('data-ev'), {}); });
  });

  var head = document.querySelector('.head'), sticky = document.querySelector('.sticky'), fixo = head && head.classList.contains('solid');
  var nav = document.getElementById('menu'), burger = document.querySelector('.burger');
  function rolar() {
    var y = window.scrollY || 0;
    if (head && !fixo) { head.classList.toggle('solid', y > 60 || (nav && nav.classList.contains('open'))); }
    if (sticky) { sticky.classList.toggle('on', y > window.innerHeight * 0.7); }
  }
  window.addEventListener('scroll', rolar, { passive: true }); rolar();
  function menu(abrir) {
    nav.classList.toggle('open', abrir); burger.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    burger.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu'); rolar();
  }
  if (nav && burger) {
    burger.addEventListener('click', function () { menu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { menu(false); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { menu(false); burger.focus(); } });
  }
  var contato = document.getElementById('contato');
  if (sticky && contato && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { sticky.style.display = en[0].isIntersecting ? 'none' : ''; }, { threshold: 0.12 }).observe(contato);
  }

  /* video da primeira dobra */
  var frame = document.querySelector('.frame'), video = frame && frame.querySelector('video'), vbtn = document.getElementById('vbtn');
  var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var economia = navigator.connection && navigator.connection.saveData;
  if (video && vbtn) {
    if (reduz || economia) { vbtn.hidden = true; }
    else {
      video.src = video.getAttribute(window.innerWidth < 700 ? 'data-sm' : 'data-lg');
      video.addEventListener('playing', function () { frame.classList.add('playing'); vbtn.textContent = 'Pausar vídeo'; vbtn.setAttribute('aria-pressed', 'false'); });
      video.addEventListener('pause', function () { vbtn.textContent = 'Reproduzir vídeo'; vbtn.setAttribute('aria-pressed', 'true'); });
      video.addEventListener('error', function () { vbtn.hidden = true; });
      var p = video.play(); if (p && p.catch) { p.catch(function () { vbtn.textContent = 'Reproduzir vídeo'; }); }
      vbtn.addEventListener('click', function () { if (video.paused) { video.play(); } else { video.pause(); } });
    }
  }

  /* formulario: valida e abre o WhatsApp com a mensagem pronta */
  var form = document.getElementById('form');
  if (form) {
    var status = form.querySelector('.status'), botao = form.querySelector('button[type=submit]');
    var regras = {
      nome: function (el) { return el.value.trim().length >= 2 ? '' : 'Digite seu nome.'; },
      objetivo: function (el) { return el.value ? '' : 'Escolha um objetivo.'; },
      formato: function (el) { return el.value ? '' : 'Escolha presencial ou online.'; },
      aceite: function (el) { return el.checked ? '' : 'Marque para continuar.'; }
    };
    var checar = function (n) {
      var el = form.elements[n], msg = regras[n](el), box = el.closest('.field') || el.closest('.check').parentNode;
      box.classList.toggle('invalid', !!msg); box.querySelector('.err').textContent = msg;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg;
    };
    Object.keys(regras).forEach(function (n) { form.elements[n].addEventListener(n === 'aceite' ? 'change' : 'blur', function () { checar(n); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.site.value) { return; }
      if (!Object.keys(regras).map(checar).every(Boolean)) {
        status.textContent = 'Revise os campos marcados.';
        var prim = form.querySelector('[aria-invalid=true]'); if (prim) { prim.focus(); }
        return;
      }
      var linhas = [padrao, 'Nome: ' + form.elements.nome.value.trim(), 'Objetivo: ' + form.elements.objetivo.value, 'Atendimento: ' + form.elements.formato.value];
      var extra = form.elements.mensagem.value.trim(); if (extra) { linhas.push('Mensagem: ' + extra.slice(0, 500)); }
      botao.disabled = true; status.textContent = 'Abrindo o WhatsApp…';
      var janela = window.open(wa(linhas.join('\n')), '_blank');
      if (janela) { try { janela.opener = null; } catch (err) {} }
      track('form_submit', { formato: form.elements.formato.value });
      window.setTimeout(function () {
        botao.disabled = false;
        if (!janela) { status.textContent = 'Seu navegador bloqueou a janela. Toque no número do WhatsApp ao lado para falar com a Juliana.'; return; }
        window.location.href = form.getAttribute('data-ok');
      }, 700);
    });
  }
  if (document.body.getAttribute('data-page') === 'obrigado') { track('mensagem_preparada', {}); }
  var ano = document.getElementById('ano'); if (ano) { ano.textContent = String(new Date().getFullYear()); }
})();
