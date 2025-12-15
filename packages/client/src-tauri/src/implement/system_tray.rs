use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Manager,
};

use crate::utils::base::restore_and_focus_window;

pub fn system_tray_menu(app: &mut App) -> Result<(), tauri::Error> {
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let system_menu = Menu::with_items(app, &[&quit])?;

    let system_tray = TrayIconBuilder::with_id("tray")
        .menu(&system_menu)
        .show_menu_on_left_click(false)
        .icon(app.default_window_icon().unwrap().clone())
        .build(app)?;

    system_tray.on_tray_icon_event(|tray, event| {
        if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        } = event
        {
            if let Some(window) = tray.app_handle().get_webview_window("main") {
                let is_minimized = window.is_minimized().unwrap_or(false);
                let is_visible = window.is_visible().unwrap_or(true);

                if is_minimized || !is_visible {
                    restore_and_focus_window(&tray.app_handle(), "main");
                } else {
                    let _ = window.hide();
                }
            }
        }
    });

    system_tray.on_menu_event(move |app_handle, event| match event.id.as_ref() {
        "quit" => {
            app_handle.exit(0);
        }
        _ => {}
    });
    Ok(())
}
