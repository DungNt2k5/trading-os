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
            let resource_path = app
                .path()
                .resource_dir()
                .expect("Failed to get resource dir");

            let server_path = resource_path
                .join(".next")
                .join("standalone")
                .join("server.js");

            // Tìm node executable
            let node_path = resource_path
                .join("binaries")
                .join("node.exe");

            let node_exe = if node_path.exists() {
                node_path.to_string_lossy().to_string()
            } else {
                "node".to_string() // fallback dùng node từ PATH
            };

            let child = Command::new(&node_exe)
                .arg(&server_path)
                .env("PORT", "3000")
                .env("HOSTNAME", "127.0.0.1")
                .env(
                    "DATABASE_URL",
                    format!(
                        "file:{}",
                        resource_path
                            .join("prisma")
                            .join("data.db")
                            .to_string_lossy()
                    ),
                )
                .spawn()
                .expect("Failed to start Next.js server");

            app.manage(NextServer(Mutex::new(child)));

            // Mở cửa sổ sau khi server khởi động
            let window = app.get_webview_window("main").unwrap();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(2));
                window.show().unwrap();
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}