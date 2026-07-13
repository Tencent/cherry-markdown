use std::path::PathBuf;
use std::sync::Mutex;

#[cfg(any(target_os = "macos", target_os = "ios"))]
use tauri::{AppHandle, Emitter, Manager, RunEvent};

pub const SUPPORTED_EXTS: &[&str] = &["md", "markdown", "txt", "text"];

#[cfg(any(target_os = "macos", target_os = "ios"))]
const OPEN_FILE_PATH_EVENT: &str = "open_file_path";

// The file path that is passed to the app by the OS when the user
// double-clicks a markdown file or picks "Open with Cherry Markdown".
// It is written once at startup and read once from the frontend via
// the `get_launch_file_path` command.
pub struct LaunchFilePath(pub Mutex<Option<String>>);

pub fn supported_file_path(path: PathBuf) -> Option<String> {
    if !path.is_file() {
        return None;
    }

    let ext_ok = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| SUPPORTED_EXTS.contains(&e.to_lowercase().as_str()))
        .unwrap_or(false);
    if !ext_ok {
        return None;
    }

    let abs = std::fs::canonicalize(&path).unwrap_or(path);
    Some(abs.to_string_lossy().to_string())
}

/// Parse `std::env::args()` and return the first argument that
/// looks like an existing markdown file we should open on launch.
pub fn detect_launch_file() -> Option<String> {
    for arg in std::env::args().skip(1) {
        if arg.starts_with('-') {
            continue;
        }

        if let Some(path) = supported_file_path(PathBuf::from(&arg)) {
            return Some(path);
        }
    }

    None
}

pub fn take_launch_file_path(state: tauri::State<'_, LaunchFilePath>) -> Option<String> {
    let mut guard = state.0.lock().ok()?;
    guard.take()
}

#[cfg(any(target_os = "macos", target_os = "ios"))]
fn remember_launch_file(app: &AppHandle, path: String) {
    if let Some(state) = app.try_state::<LaunchFilePath>() {
        if let Ok(mut guard) = state.0.lock() {
            *guard = Some(path.clone());
        }
    }

    let _ = app.emit(OPEN_FILE_PATH_EVENT, path);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg(any(target_os = "macos", target_os = "ios"))]
pub fn handle_opened_event(app: &AppHandle, event: RunEvent) {
    if let RunEvent::Opened { urls } = event {
        for url in urls {
            if let Ok(path) = url.to_file_path() {
                if let Some(file_path) = supported_file_path(path) {
                    remember_launch_file(app, file_path);
                    break;
                }
            }
        }
    }
}

#[cfg(not(any(target_os = "macos", target_os = "ios")))]
pub fn handle_opened_event(_app: &tauri::AppHandle, _event: tauri::RunEvent) {}
