use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Wry,
};

use crate::utils::i18n::{get_current_lang, set_current_lang, subscribe_to_lang_change, Language};

use crate::utils::base::restore_and_focus_window;

fn create_tray_menu(app: &AppHandle, lang_str: &str) -> Result<Menu<Wry>, tauri::Error> {
    let language = Language::new();

    let show_main_window = MenuItem::with_id(
        app,
        "open_cherry_markdown",
        language.open_cherry_markdown.get_lang(&lang_str),
        true,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(
        app,
        "quit",
        language.quit.get_lang(&lang_str),
        true,
        None::<&str>,
    )?;

    let language = MenuItem::with_id(
        app,
        "language",
        language.language.get_lang(&lang_str),
        true,
        None::<&str>,
    )?;

    let menu = Menu::with_items(app, &[&show_main_window, &language, &quit])?;

    Ok(menu)
}

pub fn system_tray_menu(app: &mut App) -> Result<(), tauri::Error> {
    let app_handle_clone = app.handle().clone();

    let system_menu = create_tray_menu(&app_handle_clone, &get_current_lang())?;

    let system_tray = TrayIconBuilder::with_id("tray")
        .menu(&system_menu)
        .menu_on_left_click(false)
        .icon(app.default_window_icon().unwrap().clone())
        .build(app)?;

    system_tray.on_tray_icon_event(|tray, event| match event {
        TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        } => {
            let app = tray.app_handle();
            restore_and_focus_window(app, "main");
        }
        _ => {}
    });

    let system_tray_clone = system_tray.clone();

    system_tray.on_menu_event(move |app_handle, event| match event.id.as_ref() {
        "show_main_window" => {
            restore_and_focus_window(app_handle, "main");
        }
        "language" => {
            // 先读取当前的lang
            let lang_str = get_current_lang();
            // 如果是中文，就切换成英文
            if lang_str == "zh" {
                set_current_lang("en");
            }
            if lang_str == "en" {
                set_current_lang("zh");
            }
            let lang_str_new = get_current_lang();

            let new_menu = {
                match create_tray_menu(app_handle, &lang_str_new) {
                    Ok(menu) => menu,
                    Err(e) => {
                        eprintln!("Error creating tray menu: {:?}", e);
                        return;
                    }
                }
            };
            if let Err(e) = system_tray_clone.set_menu(Some(new_menu.clone())) {
                eprintln!("Error setting menu: {:?}", e);
            }
        }
        "quit" => {
            app_handle.exit(0);
        }
        _ => {}
    });
    let system_tray_clone_for_subscribe = system_tray.clone();
    let app_handle_clone_for_subscribe = app_handle_clone.clone();

    subscribe_to_lang_change(
        "system_tray".to_string(),
        Box::new({
            move |lang: String| {
                println!("Language changed to: {}", lang);
                let new_menu = {
                    match create_tray_menu(&app_handle_clone_for_subscribe, &lang) {
                        Ok(menu) => menu,
                        Err(e) => {
                            eprintln!("Error creating tray menu: {:?}", e);
                            return;
                        }
                    }
                };
                if let Err(e) = system_tray_clone_for_subscribe.set_menu(Some(new_menu.clone())) {
                    eprintln!("Error setting menu: {:?}", e);
                }
            }
        }),
    );

    Ok(())
}
