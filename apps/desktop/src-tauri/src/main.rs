#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{
    Emitter,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};

mod capture;
mod overlay;
mod shortcut;

use capture::MonitorCapture;
use overlay::OverlayManager;

struct AppState {
    overlay: Mutex<OverlayManager>,
}

#[tauri::command]
fn capture_screens() -> Result<Vec<MonitorCapture>, String> {
    capture::capture_all_screens()
}

#[tauri::command]
fn get_shortcut_label() -> String {
    shortcut::shortcut_label()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            overlay: Mutex::new(OverlayManager::new()),
        })
        .setup(|app| {
            let _ = shortcut::register_shortcuts(app.handle());

            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let capture_now = MenuItem::with_id(app, "capture", "Capture Screenshot", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&capture_now, &quit])?;

            TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "capture" => {
                        let _ = app.emit("menu-capture", ());
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![capture_screens, get_shortcut_label])
        .run(tauri::generate_context!())
        .expect("error while running Roki");
}
