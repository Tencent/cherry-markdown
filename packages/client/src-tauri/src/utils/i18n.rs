#[derive(Clone)]
pub struct BilingualMenuItem {
    en: String,
    zh: String,
}

impl BilingualMenuItem {
    fn new(en: &str, zh: &str) -> Self {
        BilingualMenuItem {
            en: en.to_string(),
            zh: zh.to_string(),
        }
    }

    pub fn get_lang(&self, lang: &str) -> String {
        match lang {
            "zh" => self.zh.clone(),
            _ => self.en.clone(),
        }
    }
}

#[derive(Clone)]
pub struct Language {
    pub file: BilingualMenuItem,
    pub new_file: BilingualMenuItem,
    pub open_file: BilingualMenuItem,
    pub save: BilingualMenuItem,
    pub save_as: BilingualMenuItem,
    pub quit: BilingualMenuItem,
    pub language: BilingualMenuItem,
    pub setting: BilingualMenuItem,
    pub show_toolbar: BilingualMenuItem,
}

impl Language {
    pub fn new() -> Self {
        Language {
            file: BilingualMenuItem::new("File", "文件"),
            new_file: BilingualMenuItem::new("New File", "新建文件"),
            open_file: BilingualMenuItem::new("Open File...", "打开文件..."),
            save: BilingualMenuItem::new("Save", "保存"),
            save_as: BilingualMenuItem::new("Save As...", "另存为..."),
            quit: BilingualMenuItem::new("Quit", "退出"),
            language: BilingualMenuItem::new("Language", "语言"),
            setting: BilingualMenuItem::new("Setting", "设置"),
            show_toolbar: BilingualMenuItem::new("Show Toolbar", "显示工具栏"),
        }
    }
}
