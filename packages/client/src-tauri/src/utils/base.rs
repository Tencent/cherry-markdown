use tauri::{AppHandle, Manager};

pub fn restore_and_focus_window(app: &AppHandle, window_name: &str) {
    if let Some(window) = app.get_webview_window(window_name) {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}
