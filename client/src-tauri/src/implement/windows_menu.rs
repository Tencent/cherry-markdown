use std::sync::{Arc, Mutex};
use tauri::{
    menu::{CheckMenuItemBuilder, Menu, MenuBuilder, SubmenuBuilder},
    App, AppHandle, Emitter, Wry,
};

use crate::utils::i18n::{get_current_lang, set_current_lang, subscribe_to_lang_change, Language};

fn create_window_menu(
    handle: &AppHandle,
    language: Arc<Mutex<Language>>,
    lang_str: &str,
) -> Result<Menu<Wry>, tauri::Error> {
    let language = language.lock().unwrap();
    let file_menu = SubmenuBuilder::new(handle, language.file.get_lang(lang_str))
        .text("new_file", language.new_file.get_lang(lang_str))
        .text("open_file", language.open_file.get_lang(lang_str))
        .text("save", language.save.get_lang(lang_str))
        .text("save_as", language.save_as.get_lang(lang_str))
        .text("quit", language.quit.get_lang(lang_str));

    let language_sub_en = CheckMenuItemBuilder::new("English")
        .id("en")
        .checked(lang_str == "en");

    let language_sub_zh = CheckMenuItemBuilder::new("中文")
        .id("zh")
        .checked(lang_str == "zh");

    let language_menu = SubmenuBuilder::new(handle, language.language.get_lang(lang_str))
        .item(&language_sub_en.build(handle)?)
        .item(&language_sub_zh.build(handle)?);

    let menu = MenuBuilder::new(handle)
        .item(&file_menu.build()?)
        .item(&language_menu.build()?)
        .build()?;
    Ok(menu)
}

/// 窗口菜单
pub fn window_menu(app: &mut App) -> Result<(), tauri::Error> {
    let handle = app.handle();
    let language = Arc::new(Mutex::new(Language::new()));

    let menu = create_window_menu(&handle, language.clone(), &get_current_lang())?;
    app.set_menu(menu)?;

    let handle_clone = handle.clone();
    let language_clone = language.clone();

    app.on_menu_event(
        move |app_handle: &tauri::AppHandle, event| match event.id().0.as_str() {
            "en" | "zh" => {
                set_current_lang(&event.id().0.as_str());
                if let Ok(menu) =
                    create_window_menu(&handle_clone, language_clone.clone(), &get_current_lang())
                {
                    let _ = app_handle.set_menu(menu);
                }
            }
            "new_file" => {
                let _ = app_handle.emit("new_file", "");
            }
            "open_file" => {
                let _ = app_handle.emit("open_file", "");
            }
            "save" => {
                let _ = app_handle.emit("save", "");
            }
            "save_as" => {
                let _ = app_handle.emit("save_as", "");
            }
            "quit" => {
                app_handle.exit(0);
            }
            _ => {}
        },
    );

    subscribe_to_lang_change(
        "windows_menu".to_string(),
        Box::new({
            let handle_clone = handle.clone();
            let language_clone = language.clone();

            move |lang: String| {
                println!("windows_menu Language changed to: {}", lang);
                if let Ok(menu) = create_window_menu(&handle_clone, language_clone.clone(), &lang) {
                    let _ = handle_clone.set_menu(menu);
                }
            }
        }) as Box<dyn Fn(String) + Send + Sync>,
    );
    Ok(())
}
