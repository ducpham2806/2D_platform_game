import type { SaveManager, TransactResult } from '../logic/save/save-manager';
import type { CharacterProgress } from '../logic/rpg/progression';
import { type SaveData, SaveError, summarize } from '../logic/save/save-data';
import { createPanel, panelActions, panelButton } from '../playtest/panel';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60} phút` : `${m} phút`;
}

function formatDate(ms: number): string {
  return ms > 0 ? new Date(ms).toLocaleString('vi-VN') : 'chưa lưu';
}

/**
 * Bảng "Dữ liệu lưu" (M11): tóm tắt bản lưu, mã sao lưu để chép sang máy khác, nhập mã,
 * xóa tiến trình (bấm hai lần để xác nhận). Trả về hàm đóng bảng.
 */
export function showSavePanel(
  save: SaveManager,
  onBack: () => void,
  /** Cấp và SP của bản lưu (M8), tính từ dữ liệu cấu hình. */
  progress: (data: SaveData) => CharacterProgress,
): () => void {
  const { root, body } = createPanel('Dữ liệu lưu', 'cv-json cv-save');
  const summary = document.createElement('div');
  const exportLabel = document.createElement('div');
  exportLabel.className = 'cv-panel-note';
  exportLabel.textContent = save.readUnavailable
    ? 'Mã sao lưu của phiên tạm (không phải bản lưu trên máy):'
    : 'Mã sao lưu (chép sang máy khác rồi nhập ở đó):';
  const exportArea = document.createElement('textarea');
  exportArea.readOnly = true;
  const importArea = document.createElement('textarea');
  importArea.placeholder = 'Dán mã sao lưu vào đây rồi bấm "Nhập mã". Bản hiện tại sẽ bị thay.';
  const status = document.createElement('div');
  status.className = 'cv-panel-note';
  status.setAttribute('role', 'status');

  const refresh = (): void => {
    const s = summarize(save.data);
    const p = progress(save.data);
    summary.textContent =
      `Cấp: ${p.level} · SP: ${p.skillPoints} · EXP: ${s.exp} · Boss đã hạ: ${s.bosses} · ` +
      `Core Bit: ${s.coreBits} · ` +
      `Thời gian chơi: ${formatTime(s.playTimeSec)} · Lần lưu cuối: ${formatDate(s.savedAt)}`;
    exportArea.value = save.exportCode();
  };

  const copy = panelButton('Sao chép mã', () => {
    exportArea.select();
    navigator.clipboard?.writeText(exportArea.value).then(
      () => (status.textContent = 'Đã sao chép mã sao lưu.'),
      () =>
        (status.textContent = 'Trình duyệt chặn sao chép: hãy chọn chữ trong ô rồi sao chép tay.'),
    );
  });
  let armed = false;
  let busy = false;
  const setBusy = (pending: boolean): void => {
    busy = pending;
    doImport.disabled = reset.disabled = importArea.disabled = pending || save.readOnly;
    copy.disabled = back.disabled = pending;
  };
  const write = async (
    change: () => Promise<TransactResult>,
    onSuccess: () => void,
  ): Promise<void> => {
    if (busy || save.readOnly) return;
    setBusy(true);
    status.textContent = 'Đang ghi dữ liệu lưu…';
    try {
      const result = await change();
      if (result.ok) onSuccess();
      else status.textContent = `${result.error} Có thể sao chép mã sao lưu bên trên.`;
      refresh();
    } catch (e) {
      status.textContent = e instanceof SaveError ? e.message : String(e);
    } finally {
      setBusy(false);
    }
  };
  const doImport = panelButton('Nhập mã', () => {
    if (busy || save.readOnly) return;
    armed = false;
    reset.textContent = 'Xóa dữ liệu';
    void write(
      () => save.importCode(importArea.value),
      () => {
        importArea.value = '';
        status.textContent = save.notice ? `Đã nhập bản lưu. ${save.notice}` : 'Đã nhập bản lưu.';
        save.notice = undefined;
      },
    );
  });
  const reset = panelButton('Xóa dữ liệu', () => {
    if (busy || save.readOnly) return;
    if (!armed) {
      armed = true;
      reset.textContent = 'Bấm lần nữa để xóa';
      status.textContent = 'Xóa toàn bộ tiến trình trên máy này? Không hoàn tác được.';
      return;
    }
    armed = false;
    reset.textContent = 'Xóa dữ liệu';
    void write(
      () => save.reset(),
      () => {
        status.textContent = 'Đã xóa tiến trình.';
      },
    );
  });
  const close = (): void => {
    root.remove();
  };
  const back = panelButton(
    'Về menu',
    () => {
      if (busy) return;
      close();
      onBack();
    },
    true,
  );
  body.append(
    summary,
    exportLabel,
    exportArea,
    importArea,
    status,
    panelActions(copy, doImport, reset, back),
  );
  refresh();
  if (save.readUnavailable)
    status.textContent =
      'Không đọc được bản lưu. Phiên này không ghi vào kho; sao lưu trước khi tải lại để thử đọc.';
  else if (save.readOnly) status.textContent = `${save.lastError ?? ''} Bản lưu không bị ghi đè.`;
  else if (save.lastError)
    status.textContent = `${save.lastError} Có thể sao chép mã sao lưu bên trên.`;
  setBusy(false);
  return close;
}
