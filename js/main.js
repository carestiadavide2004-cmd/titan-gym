// Titan Gym: menu, parallasse, comparsa allo scorrimento, contatori, lightbox e modulo

const menoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Intestazione e menu ---------- */

const intestazione = document.querySelector(".intestazione");
const menuPulsante = document.querySelector(".menu-pulsante");
const navigazione = document.querySelector(".navigazione");

function impostaMenu(aperto) {
  if (aperto) navigazione.scrollTop = 0; // riparte sempre dalla prima voce
  navigazione.classList.toggle("aperta", aperto);
  menuPulsante.setAttribute("aria-expanded", aperto);
  menuPulsante.setAttribute("aria-label", aperto ? "Chiudi il menu" : "Apri il menu");
  document.body.style.overflow = aperto ? "hidden" : "";
}

menuPulsante.addEventListener("click", () => {
  impostaMenu(!navigazione.classList.contains("aperta"));
});

// Scegliere una voce chiude il menu su smartphone
navigazione.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => impostaMenu(false));
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && navigazione.classList.contains("aperta")) impostaMenu(false);
});

/* ---------- Parallasse della home e intestazione scura allo scorrimento ---------- */

const sfondoHero = document.querySelector(".hero-sfondo");
const hero = document.querySelector(".hero");
let inAttesa = false;

function aggiornaScorrimento() {
  const y = window.scrollY;
  intestazione.classList.toggle("scorrendo", y > 40);

  // Lo sfondo si muove a un terzo della velocità: effetto profondità leggero
  if (!menoMovimento && y < hero.offsetHeight) {
    sfondoHero.style.transform = `translate3d(0, ${y * 0.3}px, 0) scale(1.05)`;
  }
  inAttesa = false;
}

window.addEventListener("scroll", () => {
  if (!inAttesa) {
    inAttesa = true;
    requestAnimationFrame(aggiornaScorrimento);
  }
}, { passive: true });

aggiornaScorrimento();

/* ---------- Voce di menu attiva in base alla sezione visibile ---------- */

const linkMenu = [...navigazione.querySelectorAll("a")];

const osservaSezioni = new IntersectionObserver((voci) => {
  voci.forEach((voce) => {
    if (!voce.isIntersecting) return;
    // Le sezioni senza voce propria (es. dettaglio corsi) indicano quale voce accendere
    const voceMenu = voce.target.dataset.menu || voce.target.id;
    linkMenu.forEach((link) => {
      link.classList.toggle("attivo", link.getAttribute("href") === "#" + voceMenu);
    });
  });
}, { rootMargin: "-45% 0px -50% 0px" });

document.querySelectorAll("main section[id]").forEach((sezione) => osservaSezioni.observe(sezione));

/* ---------- Comparsa degli elementi allo scorrimento ---------- */

const osservaComparsa = new IntersectionObserver((voci, osservatore) => {
  voci.forEach((voce) => {
    if (voce.isIntersecting) {
      voce.target.classList.add("visibile");
      osservatore.unobserve(voce.target);
    }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

document.querySelectorAll(".rivela").forEach((elemento) => osservaComparsa.observe(elemento));

/* ---------- Contatori animati ---------- */

function animaContatore(elemento) {
  const obiettivo = Number(elemento.dataset.conta);
  if (menoMovimento) {
    elemento.textContent = obiettivo;
    return;
  }
  const durata = 2000;
  const inizio = performance.now();

  function passo(adesso) {
    const avanzamento = Math.min((adesso - inizio) / durata, 1);
    // Rallenta verso la fine (ease-out)
    const curva = 1 - Math.pow(1 - avanzamento, 4);
    elemento.textContent = Math.round(obiettivo * curva);
    if (avanzamento < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

const osservaContatori = new IntersectionObserver((voci, osservatore) => {
  voci.forEach((voce) => {
    if (voce.isIntersecting) {
      animaContatore(voce.target);
      osservatore.unobserve(voce.target);
    }
  });
}, { threshold: 0.6 });

document.querySelectorAll("[data-conta]").forEach((numero) => osservaContatori.observe(numero));

/* ---------- Galleria: foto ingrandite (lightbox) ---------- */

const lightbox = document.querySelector(".lightbox");
const immagineGrande = lightbox.querySelector(".lightbox-immagine");
const didascaliaGrande = lightbox.querySelector(".lightbox-didascalia");
const pulsanteChiudi = lightbox.querySelector(".lightbox-chiudi");
const frecciaPrec = lightbox.querySelector(".lightbox-freccia--prec");
const frecciaSucc = lightbox.querySelector(".lightbox-freccia--succ");
const elementiGalleria = [...document.querySelectorAll(".galleria-elemento")];
let indiceCorrente = 0;

// Le foto Unsplash sono ritagliate a 800x600 per la griglia:
// nella versione ingrandita chiediamo la foto intera e più definita
function versioneGrande(src) {
  if (!src.includes("images.unsplash.com")) return src;
  const url = new URL(src);
  url.searchParams.delete("h");
  url.searchParams.delete("fit");
  url.searchParams.set("w", "1600");
  url.searchParams.set("q", "85");
  return url.toString();
}

function mostra(indice, conAnimazione) {
  indiceCorrente = (indice + elementiGalleria.length) % elementiGalleria.length;
  const elemento = elementiGalleria[indiceCorrente];
  const foto = elemento.querySelector("img");
  immagineGrande.src = versioneGrande(foto.currentSrc || foto.src);
  immagineGrande.alt = foto.alt;
  didascaliaGrande.textContent = elemento.querySelector("figcaption")?.textContent ?? "";

  if (conAnimazione) {
    immagineGrande.classList.remove("cambio");
    void immagineGrande.offsetWidth; // fa ripartire l'animazione
    immagineGrande.classList.add("cambio");
  }
}

function apri(indice) {
  mostra(indice, false);
  lightbox.showModal();
  document.body.classList.add("lightbox-aperta");
}

function chiudi() {
  lightbox.close();
}

elementiGalleria.forEach((elemento, indice) => {
  // Rende ogni foto raggiungibile e apribile anche da tastiera
  elemento.tabIndex = 0;
  elemento.setAttribute("role", "button");
  elemento.setAttribute("aria-label", "Ingrandisci: " + elemento.querySelector("img").alt);

  elemento.addEventListener("click", () => apri(indice));
  elemento.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      apri(indice);
    }
  });
});

pulsanteChiudi.addEventListener("click", chiudi);
frecciaPrec.addEventListener("click", () => mostra(indiceCorrente - 1, true));
frecciaSucc.addEventListener("click", () => mostra(indiceCorrente + 1, true));

// Frecce della tastiera per sfogliare le foto
lightbox.addEventListener("keydown", (evento) => {
  if (evento.key === "ArrowLeft") mostra(indiceCorrente - 1, true);
  if (evento.key === "ArrowRight") mostra(indiceCorrente + 1, true);
});

// Scorrimento del dito su smartphone per sfogliare le foto
let inizioTocco = null;
lightbox.addEventListener("touchstart", (evento) => {
  inizioTocco = evento.touches[0].clientX;
}, { passive: true });
lightbox.addEventListener("touchend", (evento) => {
  if (inizioTocco === null) return;
  const distanza = evento.changedTouches[0].clientX - inizioTocco;
  if (Math.abs(distanza) > 50) mostra(indiceCorrente + (distanza < 0 ? 1 : -1), true);
  inizioTocco = null;
});

// Clic fuori dall'immagine: lo sfondo scuro e lo spazio vuoto attorno alla foto
// appartengono al <dialog> stesso, non alla foto o alla didascalia
lightbox.addEventListener("click", (evento) => {
  if (evento.target === lightbox || evento.target.classList.contains("lightbox-contenuto")) {
    chiudi();
  }
});

// Scatta sia con la X sia con il tasto Esc
lightbox.addEventListener("close", () => {
  document.body.classList.remove("lightbox-aperta");
  immagineGrande.removeAttribute("src");
});

/* ---------- Recensioni: "Altro" per i testi lunghi e pulsante "Utile" ---------- */

function aggiornaPulsantiAltro() {
  document.querySelectorAll(".recensione").forEach((recensione) => {
    const testo = recensione.querySelector(".recensione-testo");
    const altro = recensione.querySelector(".recensione-altro");
    if (testo.classList.contains("aperta")) return;
    // Mostra "Altro" solo se il testo è stato davvero tagliato
    altro.hidden = testo.scrollHeight <= testo.clientHeight + 1;
  });
}

document.querySelectorAll(".recensione-altro").forEach((altro) => {
  altro.addEventListener("click", () => {
    altro.previousElementSibling.classList.add("aperta");
    altro.hidden = true;
  });
});

document.querySelectorAll(".recensione-utile").forEach((pulsante) => {
  const conta = pulsante.querySelector(".recensione-utile-conta");
  pulsante.addEventListener("click", () => {
    const premuto = pulsante.getAttribute("aria-pressed") === "true";
    pulsante.setAttribute("aria-pressed", !premuto);
    conta.textContent = Number(conta.textContent) + (premuto ? -1 : 1);
  });
});

aggiornaPulsantiAltro();
window.addEventListener("resize", aggiornaPulsantiAltro);
document.fonts?.ready.then(aggiornaPulsantiAltro);

/* ---------- Banner offerta di lancio: porta a "Piani e prezzi" ---------- */

const bannerPromo = document.querySelector(".banner-promo");
const sezionePrezzi = document.querySelector("#prezzi");

function vaiAiPrezzi() {
  sezionePrezzi.scrollIntoView({ behavior: menoMovimento ? "auto" : "smooth" });
}

bannerPromo.addEventListener("click", vaiAiPrezzi);
bannerPromo.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") vaiAiPrezzi();
});

/* ---------- Pulsanti che preselezionano il motivo nel modulo ---------- */

const selectMotivo = document.querySelector("#motivo");

document.querySelectorAll("[data-motivo]").forEach((pulsante) => {
  pulsante.addEventListener("click", () => {
    selectMotivo.value = pulsante.dataset.motivo;
  });
});

/* ---------- Modulo di contatto ---------- */

const modulo = document.querySelector(".modulo");
const esito = modulo.querySelector(".modulo-esito");

function messaggioErrore(campo) {
  if (campo.validity.valueMissing) {
    return campo.type === "checkbox" ? "Devi accettare per continuare." : "Questo campo è obbligatorio.";
  }
  if (campo.validity.typeMismatch) return "Inserisci un indirizzo email valido.";
  return "";
}

function controlla(campo) {
  const errore = messaggioErrore(campo);
  const contenitore = campo.closest(".campo");
  contenitore.classList.toggle("non-valido", errore !== "");
  contenitore.querySelector(".campo-errore").textContent = errore;
  return errore === "";
}

const campiObbligatori = [...modulo.querySelectorAll("[required]")];

// Ricontrolla il campo appena l'utente lo corregge
campiObbligatori.forEach((campo) => {
  campo.addEventListener(campo.type === "checkbox" ? "change" : "input", () => {
    if (campo.closest(".campo").classList.contains("non-valido")) controlla(campo);
  });
});

modulo.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const tuttiValidi = campiObbligatori.map(controlla).every(Boolean);

  if (!tuttiValidi) {
    esito.textContent = "";
    modulo.querySelector(".non-valido input, .non-valido textarea")?.focus();
    return;
  }

  // Sito dimostrativo: nessun invio reale, solo conferma a schermo
  const nome = modulo.nome.value.trim().split(" ")[0];
  esito.textContent = `Grazie ${nome}! Abbiamo ricevuto la tua richiesta, ti contatteremo entro 24 ore.`;
  modulo.reset();
});
