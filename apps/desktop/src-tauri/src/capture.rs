use base64::Engine;
use image::EncodableLayout;
use serde::Serialize;
use xcap::Monitor;

#[derive(Debug, Serialize)]
pub struct MonitorCapture {
    pub id: u32,
    pub label: String,
    pub width: u32,
    pub height: u32,
    pub data_base64: String,
}

pub fn capture_all_screens() -> Result<Vec<MonitorCapture>, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to enumerate monitors: {e}"))?;

    let mut captures = Vec::new();
    for (i, monitor) in monitors.iter().enumerate() {
        let img = monitor
            .capture_image()
            .map_err(|e| format!("Failed to capture monitor {i}: {e}"))?;

        let width = img.width();
        let height = img.height();

        let rgba = img.into_raw();
        let img = image::RgbaImage::from_raw(width, height, rgba)
            .ok_or("Failed to create image from raw data")?;

        let mut jpeg_bytes = Vec::new();
        let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut jpeg_bytes, 85);
        encoder
            .encode(img.as_bytes(), width, height, image::ExtendedColorType::Rgba8)
            .map_err(|e| format!("Failed to encode JPEG: {e}"))?;

        let encoded = base64::engine::general_purpose::STANDARD.encode(&jpeg_bytes);

        captures.push(MonitorCapture {
            id: i as u32,
            label: if monitors.len() == 1 {
                "Screen".to_string()
            } else {
                format!("Screen {}", i + 1)
            },
            width,
            height,
            data_base64: encoded,
        });
    }

    Ok(captures)
}
