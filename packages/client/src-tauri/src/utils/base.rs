use tauri::{AppHandle, Manager};

pub fn restore_and_focus_window(app: &AppHandle, window_name: &str) {
  if let Some(window) = app.get_webview_window(window_name) {
      window.unminimize().unwrap(); // 恢复窗口，如果它被最小化
      window.show().unwrap();
      window.set_focus().unwrap();
  }
}