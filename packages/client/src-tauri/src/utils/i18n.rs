use lazy_static::lazy_static;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

lazy_static! {
    pub static ref CURRENT_LANG: Mutex<String> = Mutex::new("en".to_string());
    pub static ref OBSERVER: Arc<Observer> = Arc::new(Observer::new());
}

// 定义回调函数类型，回调函数接受一个 String 参数并返回空。
type Callback = Box<dyn Fn(String) + Send + Sync>;

// 定义观察者结构体，用于存储回调函数。
pub struct Observer {
    callbacks: Mutex<HashMap<String, Callback>>,
}

impl Observer {
    // 构造函数，创建一个新的 Observer 实例。
    fn new() -> Self {
        Observer {
            callbacks: Mutex::new(HashMap::new()),
        }
    }

    // 订阅方法，添加一个新的回调函数。
    fn subscribe(&self, id: String, callback: Callback) {
        let mut callbacks = self.callbacks.lock().unwrap();
        callbacks.insert(id, callback);
    }

    // 通知方法，调用所有已订阅的回调函数。
    fn notify(&self, lang: String) {
        let callbacks = self.callbacks.lock().unwrap();
        for callback in callbacks.values() {
            callback(lang.clone());
        }
    }
}

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
    pub open_cherry_markdown: BilingualMenuItem,
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
            open_cherry_markdown: BilingualMenuItem::new(
                "Open Cherry Markdown",
                "打开 Cherry Markdown",
            ),
        }
    }
}

pub fn set_current_lang(lang: &str) {
    let mut current_lang = CURRENT_LANG.lock().unwrap();
    *current_lang = lang.to_string();
    OBSERVER.notify(lang.to_string());
}

pub fn get_current_lang() -> String {
    let current_lang = CURRENT_LANG.lock().unwrap();
    current_lang.clone()
}

pub fn subscribe_to_lang_change(id: String, callback: Callback) {
    OBSERVER.subscribe(id, callback);
}
