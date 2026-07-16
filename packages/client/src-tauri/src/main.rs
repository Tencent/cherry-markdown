// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod implement;
mod utils;

use std::sync::Mutex;
use tauri::Manager;
use utils::file_open::{
    detect_launch_file, handle_opened_event, take_launch_file_path, LaunchFilePath,
};

/// Return the file path that the OS asked us to open on launch
/// (double-click / "Open with" / command-line argument), if any.
/// The value is consumed on first read to avoid re-opening the same
/// file on subsequent frontend reloads.
#[tauri::command]
fn get_launch_file_path(state: tauri::State<'_, LaunchFilePath>) -> Option<String> {
    take_launch_file_path(state)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // Persist window size / position / maximized state across launches.
        // The plugin auto-attaches listeners to every window and stores state
        // in `$APPCONFIG/.window-state.json`.
        .plugin(tauri_plugin_window_state::Builder::new().build())
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
