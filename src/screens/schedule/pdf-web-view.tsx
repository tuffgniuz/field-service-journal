import React from 'react';
import { WebView } from 'react-native-webview';

/**
 * iOS/Android only (see pdf-web-view.web.tsx for why) — WKWebView renders
 * PDFs from a local file natively, which is what service-area-screen.tsx
 * uses this for. Android doesn't actually render this (its stock WebView has
 * no built-in PDF support), but the component itself is harmless there.
 */
export function PdfWebView({ uri, style }: { uri: string; style?: object }) {
  return <WebView source={{ uri }} style={style} originWhitelist={['*']} />;
}
