use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct NextServer(Mutex<Child>);

impl Drop for NextServer {
    fn drop(&mut self) {
        if let Ok(mut child) = self.0.lock() {
            let _ = child.kill();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let exe_dir = std::env::current_exe()
                .expect("Failed to get exe path")
                .parent()
                .expect("Failed to get exe dir")
                .to_path_buf();

            let node_exe = exe_dir.join("node.exe");
            let resources_dir = exe_dir.join("_up_");

            let standalone_dir = resources_dir
                .join(".next")
                .join("standalone");

            let server_path = standalone_dir.join("server.js");

            let db_path = resources_dir
                .join("prisma")
                .join("data.db");

            let node_exe_str = if node_exe.exists() {
                node_exe.to_string_lossy().to_string()
            } else {
                "node".to_string()
            };

            let child = Command::new(&node_exe_str)
                .arg(&server_path)
                .current_dir(&standalone_dir)   // ← FIX CHÍNH
                .env("PORT", "3000")
                .env("HOSTNAME", "127.0.0.1")
                .env("DATABASE_URL", format!("file:{}", db_path.to_string_lossy()))
                .env("NEXT_TELEMETRY_DISABLED", "1")
                .spawn()
                .expect("Failed to start Next.js server");

            app.manage(NextServer(Mutex::new(child)));

            let window = app.get_webview_window("main").unwrap();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(3));
                window.show().unwrap();
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}