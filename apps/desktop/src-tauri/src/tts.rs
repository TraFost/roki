use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

const TTS_SERVER_URL: &str = "http://127.0.0.1:8765";

pub struct TtsProcess {
    process: Mutex<Option<Child>>,
}

impl TtsProcess {
    pub fn new() -> Self {
        TtsProcess {
            process: Mutex::new(None),
        }
    }

    pub fn spawn(&self) -> Result<(), String> {
        let python = find_python().ok_or("Python not found in PATH")?;

        let server_path = std::env::current_dir()
            .map_err(|e| e.to_string())?
            .join("apps")
            .join("tts-server")
            .join("server.py");

        if !server_path.exists() {
            return Err(format!("TTS server not found at {:?}", server_path));
        }

        let child = Command::new(python)
            .arg(server_path.to_str().unwrap())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to spawn TTS server: {}", e))?;

        let mut process = self.process.lock().unwrap();
        *process = Some(child);

        Ok(())
    }

    pub fn kill(&self) {
        if let Ok(mut process) = self.process.lock() {
            if let Some(ref mut child) = *process {
                let _ = child.kill();
                let _ = child.wait();
            }
            *process = None;
        }
    }

}

fn find_python() -> Option<String> {
    let candidates = ["python", "python3", "python.exe", "python3.exe"];
    for cmd in &candidates {
        if Command::new(cmd)
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .is_ok()
        {
            return Some(cmd.to_string());
        }
    }
    None
}

#[tauri::command]
pub fn tts_speak(text: String) -> Result<Vec<u8>, String> {
    let client = reqwest::blocking::Client::new();
    let resp = client
        .post(format!("{}/tts", TTS_SERVER_URL))
        .json(&serde_json::json!({ "text": text }))
        .send()
        .map_err(|e| format!("TTS request failed: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("TTS server returned {}", resp.status()));
    }

    let bytes = resp
        .bytes()
        .map_err(|e| format!("Failed to read TTS response: {}", e))?;

    Ok(bytes.to_vec())
}

#[tauri::command]
pub fn tts_status() -> Result<bool, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()
        .map_err(|e| e.to_string())?;

    match client.get(format!("{}/health", TTS_SERVER_URL)).send() {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}
