document.addEventListener("DOMContentLoaded", function () {
  var nav = document.querySelector(".nav");
  if (!nav) {
    return;
  }

  var toggle = nav.querySelector(".nav-toggle");
  var links = nav.querySelector(".nav-links");
  if (!toggle || !links) {
    return;
  }

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("is-open");
  }

  function toggleMenu() {
    var isExpanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", isExpanded ? "false" : "true");
    links.classList.toggle("is-open", !isExpanded);
  }

  toggle.addEventListener("click", toggleMenu);

  links.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", function (event) {
    if (!nav.contains(event.target)) {
      closeMenu();
    }
  });

  var desktopMedia = window.matchMedia("(min-width: 981px)");
  function handleDesktopSwitch(event) {
    if (event.matches) {
      closeMenu();
    }
  }

  if (typeof desktopMedia.addEventListener === "function") {
    desktopMedia.addEventListener("change", handleDesktopSwitch);
  } else {
    desktopMedia.addListener(handleDesktopSwitch);
  }
});
