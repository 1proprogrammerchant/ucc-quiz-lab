export const initBackgroundOrbs = () => {
  const host = document.querySelector(".bg-orbs");
  if (!host) {
    return;
  }

  const extra = document.createElement("div");
  extra.className = "orb-trail";
  host.appendChild(extra);
};
