use tauri::AppHandle;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

const PUSH_TO_TALK_SHORTCUT: &str = "Ctrl+Shift+Space";

pub fn register_shortcuts(app: &AppHandle) -> Result<(), String> {
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);

    app.global_shortcut()
        .register(shortcut)
        .map_err(|e| format!("Failed to register shortcut: {e}"))?;

    Ok(())
}

pub fn shortcut_label() -> String {
    PUSH_TO_TALK_SHORTCUT.to_string()
}
