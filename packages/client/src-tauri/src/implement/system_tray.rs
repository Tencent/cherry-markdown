use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    App,
};

use crate::utils::i18n::Language;

use crate::utils::base::restore_and_focus_window;

pub fn system_tray_menu(app: &mut App) -> Result<(), tauri::Error> {
    let lang_str = "en".to_string();
    let language = Language::new();

    let quit = MenuItem::with_id(
        app,
        "quit",
        language.quit.get_lang(&lang_str),
        true,
        None::<&str>,
    )?;

    // todo
    // let language = MenuItem::with_id(
    //     app,
    //     "language",
    //     language.language.get_lang(&lang_str),
    //     true,
    //     None::<&str>,
    // )?;

    let system_menu = Menu::with_items(app, &[&quit])?;

    let system_tray = TrayIconBuilder::with_id("tray")
        .menu(&system_menu)
        .show_menu_on_left_click(false)
        .icon(app.default_window_icon().unwrap().clone())
        .build(app)?;

    system_tray.on_menu_event(move |app_handle, event| match event.id.as_ref() {
        "show_main_window" => {
            println!("show_main_window");
            restore_and_focus_window(app_handle, "main");
        }
        "quit" => {
            app_handle.exit(0);
        }
        _ => {}
    });
    Ok(())
}
