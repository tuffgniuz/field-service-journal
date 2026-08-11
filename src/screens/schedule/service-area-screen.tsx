import React, { useMemo, useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PdfWebView } from './pdf-web-view';
import { ZoomableImage } from '../../components/media/zoomable-image';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { DocumentIcon, MapIcon, TrashIcon } from '../../components/data-display/icons';
import { PillButton } from '../../components/actions/pill-button';
import {
  pickServiceAreaFile,
  serviceAreaDataUri,
  serviceAreaTempFileUri,
  viewServiceAreaFileAndroid,
} from '../../utils/service-area';
import { formatRelativeTime } from '../../utils/dates';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { RootNavProp } from '../../navigation/types';
import type { ServiceAreaFile } from '../../store/types';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];

export function ServiceAreaScreen({ navigation }: { navigation: RootNavProp }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const file = state.serviceAreaFile;
  const isImage = file ? IMAGE_EXTENSIONS.includes(file.extension) : false;
  const dataUri = file ? serviceAreaDataUri(file) : '';

  // Only relevant for a PDF on iOS — WKWebView needs a real local file to
  // render (see utils/service-area.ts), so this is written once per file,
  // not recomputed on every render.
  const iosPdfUri = useMemo(
    () => (file && !isImage && Platform.OS === 'ios' ? serviceAreaTempFileUri(file) : null),
    [file, isImage]
  );

  const upload = async () => {
    setBusy(true);
    try {
      const picked = await pickServiceAreaFile();
      if (picked) actions.setServiceAreaFile(picked);
    } finally {
      setBusy(false);
    }
  };

  const viewOnAndroid = (f: ServiceAreaFile) => {
    viewServiceAreaFileAndroid(f);
  };

  const onDelete = () => {
    if (!file) return;
    Alert.alert(t('serviceArea.deleteTitle'), t('serviceArea.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('serviceArea.remove'), style: 'destructive', onPress: () => actions.setServiceAreaFile(null) },
    ]);
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg, paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel={t('common.back')}>
          <Text style={[styles.back, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t('serviceArea.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.container}>
        {!file ? (
          <>
            <View style={[styles.emptyCard, { borderColor: theme.border }]}>
              <MapIcon color={theme.secondaryText} size={30} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('serviceArea.emptyTitle')}</Text>
              <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
                {t('serviceArea.emptySubtitle')}
              </Text>
            </View>
            <PillButton
              label={t(busy ? 'serviceArea.uploading' : 'serviceArea.uploadFile')}
              onPress={upload}
              theme={theme}
              disabled={busy}
              style={{ marginTop: 20 }}
            />
          </>
        ) : (
          <>
            {isImage ? (
              <Pressable onPress={() => setFullScreen(true)} accessibilityLabel={t('serviceArea.viewAccessibility')}>
                <Image
                  source={{ uri: dataUri }}
                  style={[styles.imagePreview, { borderColor: theme.border, backgroundColor: theme.card }]}
                  resizeMode="contain"
                />
              </Pressable>
            ) : Platform.OS === 'web' ? (
              <View style={[styles.pdfFrameWrap, { borderColor: theme.border }]}>
                {React.createElement('iframe', {
                  src: dataUri,
                  title: file.name,
                  style: { width: '100%', height: '100%', border: 'none' },
                })}
              </View>
            ) : Platform.OS === 'ios' && iosPdfUri ? (
              <View style={[styles.pdfFrameWrap, { borderColor: theme.border }]}>
                <PdfWebView uri={iosPdfUri} style={{ flex: 1 }} />
              </View>
            ) : (
              <Pressable
                onPress={() => viewOnAndroid(file)}
                accessibilityLabel={t('serviceArea.viewAccessibility')}
                style={[styles.pdfCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.pdfIconWrap, { backgroundColor: theme.pageBg }]}>
                  <DocumentIcon color={theme.secondaryText} size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={[styles.fileMeta, { color: theme.secondaryText }]}>{t('serviceArea.pdfDocument')}</Text>
                </View>
              </Pressable>
            )}

            <Text style={[styles.uploadedCaption, { color: theme.secondaryText }]}>
              {t('serviceArea.uploaded', { when: formatRelativeTime(file.uploadedAt, locale) })}
            </Text>

            <View style={styles.actionsRow}>
              <Pressable onPress={upload} disabled={busy} style={styles.replaceBtn}>
                <Text style={[styles.replaceLabel, { color: theme.accent }]}>
                  {t(busy ? 'serviceArea.uploading' : 'serviceArea.replace')}
                </Text>
              </Pressable>
              <Pressable
                onPress={onDelete}
                hitSlop={8}
                accessibilityLabel={t('serviceArea.remove')}
                style={[styles.deleteIconBtn, { borderColor: theme.border }]}
              >
                <TrashIcon color={theme.danger} size={16} />
              </Pressable>
            </View>
          </>
        )}
      </View>

      <Modal visible={fullScreen} transparent animationType="fade" onRequestClose={() => setFullScreen(false)}>
        <View style={styles.fullScreenScrim}>
          <ZoomableImage uri={dataUri} style={styles.fullScreenImage} />
          <Pressable
            onPress={() => setFullScreen(false)}
            hitSlop={10}
            accessibilityLabel={t('common.back')}
            style={[styles.fullScreenCloseBtn, { top: insets.top + 12 }]}
          >
            <Text style={styles.fullScreenCloseLabel}>✕</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  back: { fontSize: 22, lineHeight: 22 },
  title: { fontSize: 15.5, fontWeight: '700' },
  container: { flex: 1, paddingHorizontal: 24 },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dotted',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 15.5, fontWeight: '700', marginTop: 14, marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  imagePreview: { width: '100%', height: 280, borderRadius: 16, borderWidth: 1 },
  pdfFrameWrap: { width: '100%', height: 420, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  pdfIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 14.5, fontWeight: '700', marginBottom: 3 },
  fileMeta: { fontSize: 12.5 },
  uploadedCaption: { fontSize: 12.5, marginTop: 12 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  replaceBtn: { paddingVertical: 8 },
  replaceLabel: { fontSize: 14, fontWeight: '600' },
  deleteIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  fullScreenCloseBtn: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenCloseLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
