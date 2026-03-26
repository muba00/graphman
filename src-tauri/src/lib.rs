use std::collections::HashMap;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn fetch_graphql(
    endpoint: String,
    query: String,
    variables: Option<serde_json::Value>,
    headers: Option<HashMap<String, String>>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let mut req = client.post(&endpoint);

    req = req.header("Content-Type", "application/json");
    req = req.header("Accept", "application/json");

    if let Some(h) = headers {
        for (k, v) in h {
            req = req.header(&k, &v);
        }
    }

    let mut body = HashMap::new();
    body.insert("query".to_string(), serde_json::Value::String(query));
    if let Some(v) = variables {
        body.insert("variables".to_string(), v);
    }

    let response = req
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "HTTP {}: {}",
            response.status(),
            response.status().canonical_reason().unwrap_or("Unknown")
        ));
    }

    let text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    Ok(text)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, fetch_graphql])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
