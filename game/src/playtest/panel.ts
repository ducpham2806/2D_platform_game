/** Khung bảng HTML dùng chung cho công cụ chơi thử (phiếu chấm điểm, bảng chỉnh, xuất JSON). */
export function createPanel(
  title: string,
  className = '',
): { root: HTMLDivElement; body: HTMLDivElement } {
  const root = document.createElement('div');
  root.className = `cv-panel ${className}`.trim();
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', title);
  const heading = document.createElement('div');
  heading.className = 'cv-panel-title';
  heading.textContent = title;
  const body = document.createElement('div');
  body.className = 'cv-panel-body';
  root.append(heading, body);
  document.body.append(root);
  return { root, body };
}

export function panelButton(
  label: string,
  onClick: () => void,
  primary = false,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (primary) button.className = 'primary';
  button.addEventListener('click', onClick);
  return button;
}

export function panelActions(...buttons: HTMLButtonElement[]): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'cv-panel-actions';
  row.append(...buttons);
  return row;
}

/**
 * Hộp hiện JSON để sao chép. Thử sao chép thẳng vào bộ nhớ tạm; trình duyệt không cho
 * (ví dụ trang http qua mạng LAN) thì vẫn còn ô chữ đã chọn sẵn để người chơi tự sao chép.
 */
export function showJson(title: string, text: string, onClose?: () => void): void {
  const { root, body } = createPanel(title, 'cv-json');
  const area = document.createElement('textarea');
  area.readOnly = true;
  area.value = text;
  const status = document.createElement('div');
  status.className = 'cv-panel-note';
  const close = (): void => {
    root.remove();
    onClose?.();
  };
  const copy = panelButton(
    'Sao chép',
    () => {
      area.select();
      navigator.clipboard?.writeText(text).then(
        () => (status.textContent = 'Đã sao chép vào bộ nhớ tạm.'),
        () =>
          (status.textContent =
            'Trình duyệt chặn sao chép tự động: hãy chọn chữ trong ô rồi sao chép tay.'),
      );
    },
    true,
  );
  body.append(area, status, panelActions(copy, panelButton('Đóng', close)));
  area.select();
}
