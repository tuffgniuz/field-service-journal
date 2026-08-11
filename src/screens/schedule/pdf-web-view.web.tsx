/**
 * Web build of PdfWebView. `react-native-webview` has no web implementation
 * at all, so it must never be imported into the web bundle — Metro's
 * platform-extension resolution picks this file over pdf-web-view.tsx for
 * web automatically. It's never actually rendered on web: the web branch in
 * service-area-screen.tsx displays PDFs via an inline <iframe> directly
 * instead, since browsers already render PDFs natively there.
 */
export function PdfWebView() {
  return null;
}
