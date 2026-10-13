/** Trusted inline bootstrapping code; no user input is interpolated. */
export const themeBootstrap = `(function(){try{var t=localStorage.getItem('eltaranisi.theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;
