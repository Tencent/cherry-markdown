use crate::utils::i18n::Language;
use tauri::{
    menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    App, Emitter,
};

/// 窗口菜单
pub fn window_menu(app: &mut App) -> Result<(), tauri::Error> {
    let handle = app.handle();
    let language = Language::new();
    let lang_str = "en".to_string();

    let new_file_menu = MenuItemBuilder::with_id("new_file", language.new_file.get_lang(&lang_str))
        .build(handle)?;
    let open_file_menu =
        MenuItemBuilder::with_id("open_file", language.open_file.get_lang(&lang_str))
            .build(handle)?;
    let save_menu =
        MenuItemBuilder::with_id("save", language.save.get_lang(&lang_str)).build(handle)?;
    let save_as_menu =
        MenuItemBuilder::with_id("save_as", language.save_as.get_lang(&lang_str)).build(handle)?;
    let quit_menu =
        MenuItemBuilder::with_id("quit", language.quit.get_lang(&lang_str)).build(handle)?;

    let file_menu = SubmenuBuilder::with_id(handle, "file", language.file.get_lang(&lang_str))
        .items(&[
            &new_file_menu,
            &open_file_menu,
            &save_menu,
            &save_as_menu,
            &quit_menu,
        ])
        .build()?;

    let language_sub_en = CheckMenuItemBuilder::with_id("en", "English")
        .checked(&lang_str == "en")
        .build(handle)?;

    let language_sub_zh = CheckMenuItemBuilder::with_id("zh", "中文")
        .id("zh")
        .checked(&lang_str == "zh")
        .build(handle)?;

    let language_menu = SubmenuBuilder::with_id(
        handle,
        "language_menu",
        language.language.get_lang(&lang_str),
    )
    .items(&[&language_sub_en, &language_sub_zh])
    .build()?;

    let toggle_toolbar =
        CheckMenuItemBuilder::with_id("toggle_toolbar", language.show_toolbar.get_lang(&lang_str))
            .id("toggle_toolbar")
            .checked(false)
            .build(handle)?;

    let setting_menu =
        SubmenuBuilder::with_id(handle, "setting_menu", language.setting.get_lang(&lang_str))
            .item(&toggle_toolbar)
            .build()?;

    let menu = MenuBuilder::new(handle)
        .items(&[&file_menu, &language_menu, &setting_menu])
        .build()?;

    app.set_menu(menu)?;

    app.on_menu_event(
        move |app_handle: &tauri::AppHandle, event| match event.id().0.as_str() {
            "en" | "zh" => {
                let lang_str = event.id().0.as_str();
                file_menu
                    .set_text(language.new_file.get_lang(&lang_str))
                    .expect("set file_menu text failed");
                new_file_menu
                    .set_text(language.new_file.get_lang(&lang_str))
                    .expect("set new_file_menu text failed");
                open_file_menu
                    .set_text(language.open_file.get_lang(&lang_str))
                    .expect("set open_file_menu text failed");
                save_menu
                    .set_text(language.save.get_lang(&lang_str))
                    .expect("set save_menu text failed");
                save_as_menu
                    .set_text(language.save_as.get_lang(&lang_str))
                    .expect("set save_as_menu text failed");
                quit_menu
                    .set_text(language.quit.get_lang(&lang_str))
                    .expect("set quit_menu text failed");

                language_menu
                    .set_text(language.language.get_lang(&lang_str))
                    .expect("set language_menu text failed");
                language_sub_en
                    .set_checked(lang_str == "en")
                    .expect("set en checked failed");
                language_sub_zh
                    .set_checked(lang_str == "zh")
                    .expect("set zh checked failed");

                toggle_toolbar
                    .set_text(language.show_toolbar.get_lang(&lang_str))
                    .expect("set toggle_toolbar text failed");
                setting_menu
                    .set_text(language.setting.get_lang(&lang_str))
                    .expect("set setting_menu text failed");
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
                let _ = app_handle.emit("toggle_toolbar", "");
            }
            "quit" => {
                app_handle.exit(0);
            }
            _ => {}
        },
    );
    Ok(())
}
