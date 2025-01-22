// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use utils::base::set_current_show_toolbar;

mod implement;
mod utils;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_show_toolbar() -> Result<(), String> {
    // todo show: bool 回显 是否显示工具栏 到 menu 菜单栏
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let _ = implement::windows_menu::window_menu(app);
            let _ = implement::system_tray::system_tray_menu(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_show_toolbar])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
