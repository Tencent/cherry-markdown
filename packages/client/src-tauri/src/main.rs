// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod implement;
mod utils;

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

// The file path that is passed to the app by the OS when the user
// double-clicks a markdown file or picks "Open with Cherry Markdown".
// It is written once at startup (in `setup`) and read once from the
// frontend via the `get_launch_file_path` command.
struct LaunchFilePath(Mutex<Option<String>>);

const SUPPORTED_EXTS: &[&str] = &["md", "markdown", "txt", "text"];
const OPEN_FILE_PATH_EVENT: &str = "open_file_path";

fn supported_file_path(path: PathBuf) -> Option<String> {
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
///
/// The very first argv is the executable path itself, which is skipped.
/// We only accept a candidate that:
///   - has a supported extension (.md / .markdown / .txt / .text)
///   - points to an existing file on disk
///
/// Non-file arguments (like `--flag`, tauri devtools flags, etc.) are ignored.
fn detect_launch_file() -> Option<String> {
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

fn remember_launch_file(app: &tauri::AppHandle, path: String) {
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

/// Return the file path that the OS asked us to open on launch
/// (double-click / "Open with" / command-line argument), if any.
/// The value is consumed on first read to avoid re-opening the same
/// file on subsequent frontend reloads.
#[tauri::command]
fn get_launch_file_path(state: tauri::State<'_, LaunchFilePath>) -> Option<String> {
    let mut guard = state.0.lock().ok()?;
    guard.take()
}

#[cfg(any(target_os = "macos", target_os = "ios"))]
fn handle_opened_event(app: &tauri::AppHandle, event: tauri::RunEvent) {
    if let tauri::RunEvent::Opened { urls } = event {
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
fn handle_opened_event(_app: &tauri::AppHandle, _event: tauri::RunEvent) {}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Capture the file (if any) that the OS launched us with.
            let launch_file = detect_launch_file();
            app.manage(LaunchFilePath(Mutex::new(launch_file)));

            let _ = implement::system_tray::system_tray_menu(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_launch_file_path])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            handle_opened_event(app, event);
        });
}
