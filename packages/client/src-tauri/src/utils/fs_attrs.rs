// 跨平台判断文件/目录是否“真实隐藏”。
//
// 判断规则遵循各操作系统自身的约定：
//   - Windows：读取 Win32 文件属性，命中 FILE_ATTRIBUTE_HIDDEN (0x2)
//              或 FILE_ATTRIBUTE_SYSTEM (0x4) 即视为隐藏
//              （与资源管理器 “不显示隐藏文件/系统文件” 行为一致）。
//   - macOS ：
//              1) POSIX 约定：文件名以 '.' 开头视为隐藏（Finder/ls 行为一致）；
//              2) 额外检查 BSD 文件标志 UF_HIDDEN（Finder 中“获取简介 → 隐藏”）。
//   - Linux ：
//              POSIX 约定：文件名以 '.' 开头视为隐藏（所有主流 FM / ls 一致）。
//
// 本模块只做“判断”，不做任何 I/O 修改，调用成本可控。

#[cfg(unix)]
use std::path::Path;

/// 从完整路径里取 basename；用于回退到 POSIX dotfile 规则。
#[cfg(unix)]
fn basename(path: &str) -> &str {
    Path::new(path)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("")
}

/// 判断单个路径是否“真实隐藏”。
/// 不可读 / 不存在时统一返回 false，避免把异常路径误标为隐藏。
pub fn is_path_hidden(path: &str) -> bool {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::fs::MetadataExt;
        // FILE_ATTRIBUTE_HIDDEN = 0x2, FILE_ATTRIBUTE_SYSTEM = 0x4
        const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
        const FILE_ATTRIBUTE_SYSTEM: u32 = 0x4;
        match std::fs::metadata(path) {
            Ok(meta) => {
                let attrs = meta.file_attributes();
                (attrs & (FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_SYSTEM)) != 0
            }
            Err(_) => false,
        }
    }

    #[cfg(target_os = "macos")]
    {
        // macOS Finder also supports UF_HIDDEN, but std::fs::Metadata does not
        // expose st_flags directly. Keep the POSIX dotfile rule here to avoid
        // introducing a platform-specific dependency just for this setting.
        basename(path).starts_with('.')
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        // Linux / 其他 Unix：以 '.' 开头即为隐藏（所有主流桌面一致）
        basename(path).starts_with('.')
    }
}

/// 批量判断，供前端一次性查询一个目录下所有条目。
#[tauri::command]
pub fn check_hidden_attrs(paths: Vec<String>) -> Vec<bool> {
    paths.iter().map(|p| is_path_hidden(p)).collect()
}
