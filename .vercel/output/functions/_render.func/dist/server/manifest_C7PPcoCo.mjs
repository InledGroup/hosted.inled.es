import { p as decodeKey } from './chunks/astro/server_Dgzn42Zx.mjs';
import 'clsx';
import 'cookie';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_DLaItbKt.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/dev/Documents/hosted.inled.es/","cacheDir":"file:///Users/dev/Documents/hosted.inled.es/node_modules/.astro/","outDir":"file:///Users/dev/Documents/hosted.inled.es/dist/","srcDir":"file:///Users/dev/Documents/hosted.inled.es/src/","publicDir":"file:///Users/dev/Documents/hosted.inled.es/public/","buildClientDir":"file:///Users/dev/Documents/hosted.inled.es/dist/client/","buildServerDir":"file:///Users/dev/Documents/hosted.inled.es/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/index.DBEDyVqX.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/dev/Documents/hosted.inled.es/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_C7PPcoCo.mjs","/Users/dev/Documents/hosted.inled.es/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_oW53Z-Sj.mjs","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/index.DBEDyVqX.css","/0-codigo-md.gif","/1-1.png","/1.png","/2-1.png","/2.png","/404-inled.es_.gif","/404.png","/72fb7f02-dc52-4cfe-9c5e-cd57c35252a2.jpeg","/Captura-de-pantalla-2025-05-24-a-las-15.37.45.png","/Captura-de-pantalla-2025-06-01-a-las-11.19.22.png","/Captura-de-pantalla-2025-06-06-a-las-12.37.14.png","/Captura-de-pantalla-2025-06-10-a-las-19.31.46.png","/Captura-de-pantalla-2025-06-21-a-las-14.39.46.png","/Captura-de-pantalla-2025-06-23-a-las-9.05.56.png","/Captura-de-pantalla-2025-06-23-a-las-9.16.06.png","/Captura-desde-2025-04-15-08-43-52.png","/Captura-desde-2025-04-16-14-50-33.png","/Captura-desde-2025-04-16-15-05-20.png","/Captura-desde-2025-04-16-15-05-44.png","/Captura-desde-2025-04-26-11-12-58.png","/DSIGN-SIMPLE-WHITE-removebg-preview.png","/Designer.jpeg","/ESMAXHUB-Share-Manual-Usuario-Espanol-v1.0-2023.pdf","/INDOC.png","/INLED-LEARN-COMPLETO-SF-NEGRO.png","/INLED-LEARN-COMPLETO-SF-blanco.png","/INLED_simple-removebg-preview.png","/INLINKED.png","/Launchthelauncher-ytlogo__1_-removebg-preview.png","/MANUALES-PANTALLAS-ESPANA.png","/MDPDF.png","/Manual-Bytello-OS-modelo-Xunta-de-Galicia.pdf","/MatrixCV.png","/NS_ERROR_FAILURE-0x80004005-1.png","/SwiftInstall-banner-1.png","/Tutoriales-B-ytello.png","/ainclouddeco.png","/androidlauncher-1-1.png","/aparienciawinerror copia.png","/aparienciawinerror.png","/archive.is.png","/bloqmayus.png","/bloqueos-cloudflare.svg","/boton-cerrar.png","/brave-browser-resena.png","/bytello-os-icon-espanol.png","/bytello-os-icon-ingles.png","/bytello-share-icon-espanol.png","/bytello-share-icon-ingles.png","/chatgptogpt-1.png","/cleany.png","/comemierda.gif","/corregir-con-swiftinstall.gif","/cropped-INLED_simple-removebg-preview.png","/cruzcristiana-gnome-logo.png","/d8dc77ba-4dcf-4cb5-82f4-b1017003d1bb.jpeg","/definicion-de-hacker.png","/dream.build.png","/dream.build.svg","/dsign-backgrounbd.gif","/e6fc6ec8-3474-487b-8f2b-edfab8d937e0.jpeg","/ecosia-en-start.png","/ejemplo.txt","/elimina-con-swiftinstall.gif","/empezamos-clipchamp.png","/favicon.png","/fd78388a-cbe1-42f8-8e07-541269fafc56.jpeg","/fundacionwebinled.es_.gif","/glassy.svg","/gra-b-en-dsign-inled.gif","/hacked.png","/hemos-solucionado-los-errores-en-start.png","/hidefilesonnautilus.png","/iccount.png","/icon128.png","/ies-rafael-puga-ramon-orientacion-puga-website-‐-Inled-Group.gif","/image.png","/imhuman copia.png","/imhuman.png","/imhumanprotects.gif","/inMD.png","/inled-LEARN-simple-sf-blanco.png","/inled-LEARN-simple-sf-negro.png","/inled-logo-full.png","/inled.es-en-dsign.gif","/inledai.svg","/inshare.capture.png","/inshare.png","/insharelogo.png","/instalar-con-swiftinstall.gif","/insuite.svg","/launch-the-launcher-logo-animated.gif","/launch-the-launcher-screens-tutoriales-inled.es_.png","/launcher.png","/launchthelauncher-1.gif","/launchthelauncher.banner-1-1.gif","/launchthelauncher.banner-1.gif","/launchthelauncher.gif","/linux-distros.png","/login-form.gif","/logo-1.png","/logo.fundacionconradoblanco.sf_.png","/mac-y-linux-hablando.png","/mangosolution.png","/matrixwww.ico","/maual-pantallas-bytello.pdf","/maxhub-pivot-logo.png","/maxhub-pivot-tutoriales-1.png","/maxhub-pivot-tutoriales.png","/maxhub-share-icon-ingles.png","/maxhub-share-icon.png","/maxhub-synetech-cvte-brands.png","/maxhub.png","/mdpdf.functions-2.gif","/mdpdf.functions-3.gif","/mdpdf.functions.gif","/memory-warn-logo.png","/memory-warn.png","/memorywarn1.png","/memorywarn2.png","/memorywarn3.png","/multiformat-inlinked.gif","/nfccaution.png","/nodejs.install.png","/nokiamanosrobot.png","/ojoqueparecenoseque.png","/open.archive.is.gif","/ordenadorpublico.gif","/pajaro-tomando-el-nectar-de-una-flor-que-resulta-ser-arena.jpeg","/paywall.remove.gif","/potente.gif","/pulsar-logo-full-sf.png","/pulsar-logo-simple-sf.png","/pulsar12-background.png","/responsive.png","/safari-developer-mode.png","/saltarseveyonydesactivarlo.png","/selector-buscadores.png","/share-bytelloespanol-1.png","/start-mayo-glass-neumorphism.png","/start-omnibox-inled.es-gif-‐-Hecho-con-Clipchamp.gif","/start-simple-blanco-sinfondo.png","/start.newtabpage.png","/start.search.demo.png","/startchat.png","/startomnibox-instalacion-1.png","/startomnibox-instalacion-2.png","/swiftinstall-logo.png","/swiftinstall.zip","/swiftinstallbannercolor.png","/synetech.png","/tabstacker.png","/tea-friendly.png","/teafriendlyinled.es_.gif","/texto-a-html.gif","/tutoriales-CANVA-RAPIDOS.png","/uistartchat.png","/un-telefono-gritando-cuidado.png","/v7seven.png","/warpupscale.png","/winbsod.png","/windows-11-image-microsoft.png","/windowserror.bliss.png","/windowserror.bliss_.png","/windowsopcionesprivacidad.png","/windowsquitalinuxconf11.png","/winerror.png","/images/a.txt","/swiftinstall/1.png","/swiftinstall/2.png","/swiftinstall/3.png","/swiftinstall/4.png","/swiftinstall/5.png"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"84jnJLydPCTBCbqDP8UQ5axkSNGl26wnX9TQgzp2PBI="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
