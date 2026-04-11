use serde::Serialize;
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Serialize)]
pub struct MdFileEntry {
    path: String,
    name: String,
    rel_path: String,
    size: u64,
    modified: u64,
}

#[tauri::command]
fn list_markdown_files(root: String) -> Result<Vec<MdFileEntry>, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err(format!("Not a directory: {}", root));
    }
    let mut results = Vec::new();
    for entry in WalkDir::new(&root_path)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !name.starts_with('.')
                && name != "node_modules"
                && name != "target"
                && name != "build"
                && name != "dist"
        })
        .filter_map(|e| e.ok())
    {
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path();
        let is_md = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|s| {
                let low = s.to_ascii_lowercase();
                low == "md" || low == "markdown" || low == "mdx"
            })
            .unwrap_or(false);
        if !is_md {
            continue;
        }
        let meta = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        let modified = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let rel = path
            .strip_prefix(&root_path)
            .unwrap_or(path)
            .to_string_lossy()
            .to_string();
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();
        results.push(MdFileEntry {
            path: path.to_string_lossy().to_string(),
            name,
            rel_path: rel,
            size: meta.len(),
            modified,
        });
    }
    results.sort_by(|a, b| a.rel_path.cmp(&b.rel_path));
    Ok(results)
}

#[tauri::command]
fn read_markdown_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
fn path_exists(path: String) -> bool {
    std::path::Path::new(&path).exists()
}

#[tauri::command]
fn describe_file(path: String) -> Result<MdFileEntry, String> {
    let p = PathBuf::from(&path);
    if !p.is_file() {
        return Err(format!("Not a file: {}", path));
    }
    let meta = p.metadata().map_err(|e| e.to_string())?;
    let modified = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let name = p
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    Ok(MdFileEntry {
        path: p.to_string_lossy().to_string(),
        name: name.clone(),
        rel_path: name,
        size: meta.len(),
        modified,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            list_markdown_files,
            read_markdown_file,
            path_exists,
            describe_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
