use serde::Serialize;
use std::collections::HashMap;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Debug, Clone, Serialize)]
pub struct OverlayState {
    pub visible: bool,
    pub windows: Vec<OverlayWindow>,
}

#[derive(Debug, Clone, Serialize)]
pub struct OverlayWindow {
    pub monitor_id: u32,
    pub label: String,
}

pub struct OverlayManager {
    windows: HashMap<u32, String>,
}

impl OverlayManager {
    pub fn new() -> Self {
        Self {
            windows: HashMap::new(),
        }
    }

    pub async fn create_or_show_windows(&mut self, app: &AppHandle, monitors: Vec<(u32, String)>) -> Result<(), String> {
        for (monitor_id, label) in &monitors {
            if !self.windows.contains_key(monitor_id) {
                let label_safe = label.replace(' ', "_").to_lowercase();
                let label_id = format!("overlay-{label_safe}");

                let builder = WebviewWindowBuilder::new(app, &label_id, WebviewUrl::App("overlay.html".into()))
                    .title("Roki Overlay")
                    .inner_size(800.0, 600.0)
                    .transparent(true)
                    .decorations(false)
                    .always_on_top(true)
                    .skip_taskbar(true);

                let _window = builder.build()
                    .map_err(|e| format!("Failed to build overlay window: {e}"))?;

                self.windows.insert(*monitor_id, label_id);
            } else {
                if let Some(window) = app.get_webview_window(&self.windows[monitor_id]) {
                    let _ = window.show();
                }
            }
        }

        Ok(())
    }

    pub fn hide_all(&self, app: &AppHandle) {
        for (_, label_id) in &self.windows {
            if let Some(window) = app.get_webview_window(label_id) {
                let _ = window.hide();
            }
        }
    }
}
