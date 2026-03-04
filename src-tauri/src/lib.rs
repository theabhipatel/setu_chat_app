use tauri::Manager;
use tauri::Emitter;
use tauri_plugin_deep_link::DeepLinkExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
      // Focus the existing main window
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.set_focus();
      }

      // Forward deep link URLs from the second instance to the frontend
      let urls: Vec<String> = argv.into_iter()
        .filter(|arg| arg.starts_with("setu://"))
        .collect();

      if !urls.is_empty() {
        let _ = app.emit("deep-link-received", urls);
      }
    }))
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_notification::init())
    .setup(|app| {
      #[cfg(any(windows, target_os = "linux"))]
      {
        app.deep_link().register_all()?;
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
