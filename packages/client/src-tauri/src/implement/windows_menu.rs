use crate::utils::base::{
    get_current_lang, get_current_show_toolbar, set_current_lang, subscribe_observer,
    NotifyMessage,
};
use crate::utils::i18n::Language;
use std::sync::{Arc, Mutex};
use tauri::{
    menu::{CheckMenuItemBuilder, Menu, MenuBuilder, SubmenuBuilder},
    App, AppHandle, Emitter, Wry,
};

struct State {
    lang_str: String,
    is_show_toolbar: bool,
}

fn create_window_menu(
    handle: &AppHandle,
    language: Arc<Mutex<Language>>,
    state: State,
) -> Result<Menu<Wry>, tauri::Error> {
    let language = language.lock().unwrap();
    let file_menu = SubmenuBuilder::new(handle, language.file.get_lang(&state.lang_str))
        .text("new_file", language.new_file.get_lang(&state.lang_str))
        .text("open_file", language.open_file.get_lang(&state.lang_str))
        .text("save", language.save.get_lang(&state.lang_str))
        .text("save_as", language.save_as.get_lang(&state.lang_str))
        .text("quit", language.quit.get_lang(&state.lang_str));

    let language_sub_en = CheckMenuItemBuilder::new("English")
        .id("en")
        .checked(&state.lang_str == "en");

    let language_sub_zh = CheckMenuItemBuilder::new("中文")
        .id("zh")
        .checked(&state.lang_str == "zh");

    let language_menu = SubmenuBuilder::new(handle, language.language.get_lang(&state.lang_str))
        .item(&language_sub_en.build(handle)?)
        .item(&language_sub_zh.build(handle)?);

    let toggle_toolbar = CheckMenuItemBuilder::new(language.show_toolbar.get_lang(&state.lang_str))
        .id("toggle_toolbar")
        .checked(state.is_show_toolbar);
    let setting_menu = SubmenuBuilder::new(handle, language.setting.get_lang(&state.lang_str))
        .item(&toggle_toolbar.build(handle)?);

    let menu = MenuBuilder::new(handle)
        .item(&file_menu.build()?)
        .item(&language_menu.build()?)
        .item(&setting_menu.build()?)
        .build()?;
    Ok(menu)
}

/// 窗口菜单
pub fn window_menu(app: &mut App) -> Result<(), tauri::Error> {
    let handle = app.handle();
    let language = Arc::new(Mutex::new(Language::new()));

    let menu = create_window_menu(
        &handle,
        language.clone(),
        State {
            lang_str: get_current_lang(),
            is_show_toolbar: get_current_show_toolbar(),
        },
    )?;
    app.set_menu(menu)?;
    let handle_clone = handle.clone();
    let language_clone = language.clone();

    app.on_menu_event(
        move |app_handle: &tauri::AppHandle, event| match event.id().0.as_str() {
            "en" | "zh" => {
                set_current_lang(&event.id().0.as_str());
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
            "toggle_toolbar" => {
                if let Ok(menu) = create_window_menu(
                    &handle_clone,
                    language_clone.clone(),
                    State {
                        lang_str: get_current_lang(),
                        is_show_toolbar: get_current_show_toolbar(),
                    },
                ) {
                    let _ = app_handle.set_menu(menu);
                }
                let _ = app_handle.emit("toggle_toolbar", "");
            }
            "quit" => {
                app_handle.exit(0);
            }
            _ => {}
        },
    );

    subscribe_observer(
        "windows_menu".to_string(),
        Box::new({
            let handle_clone = handle.clone();
            let language_clone = language.clone();

            move |msg: NotifyMessage| {
                match msg {
                    NotifyMessage::CurrentLang(lang) => {
                        if let Ok(menu) = create_window_menu(
                            &handle_clone,
                            language_clone.clone(),
                            State {
                                lang_str: lang,
                                is_show_toolbar: get_current_show_toolbar(),
                            },
                        ) {
                            let _ = handle_clone.set_menu(menu);
                        }
                    }
                    NotifyMessage::IsShowToolbar(show) => {
                        if let Ok(menu) = create_window_menu(
                            &handle_clone,
                            language_clone.clone(),
                            State {
                                lang_str: get_current_lang(),
                                is_show_toolbar: show,
                            },
                        ) {
                            let _ = handle_clone.set_menu(menu);
                        }
                    }
                }
            }
        }) as Box<dyn Fn(NotifyMessage) + Send + Sync>,
    );
    Ok(())
}
