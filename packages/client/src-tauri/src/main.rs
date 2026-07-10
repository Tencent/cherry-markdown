// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use utils::base::set_current_show_toolbar;

mod implement;
mod utils;

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

// The file path that is passed to the app by the OS when the user
// double-clicks a `.md` file or picks "Open with Cherry Markdown".
// It is written once at startup (in `setup`) and read once from the
// frontend via the `get_launch_file_path` command.
struct LaunchFilePath(Mutex<Option<String>>);

const SUPPORTED_EXTS: &[&str] = &["md", "markdown", "text"];

/// Parse `std::env::args()` and return the first argument that
/// looks like an existing markdown file we should open on launch.
///
/// The very first argv is the executable path itself, which is skipped.
/// We only accept a candidate that:
///   - has a supported extension (.md / .markdown / .text)
///   - points to an existing file on disk
///
/// Non-file arguments (like `--flag`, tauri devtools flags, etc.) are ignored.
fn detect_launch_file() -> Option<String> {
    for arg in std::env::args().skip(1) {
        if arg.starts_with('-') {
            continue;
        }
        let path = PathBuf::from(&arg);
        if !path.is_file() {
            continue;
        }
        let ext_ok = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| SUPPORTED_EXTS.contains(&e.to_lowercase().as_str()))
            .unwrap_or(false);
        if !ext_ok {
            continue;
        }
        // Prefer absolute path so the frontend can read it regardless of CWD.
        let abs = std::fs::canonicalize(&path).unwrap_or(path);
        return Some(abs.to_string_lossy().to_string());
    }
    None
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_show_toolbar() -> Result<(), String> {
    // todo show: bool 回显 是否显示工具栏 到 menu 菜单栏
    Ok(())
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
        .invoke_handler(tauri::generate_handler![get_show_toolbar, get_launch_file_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
