use lazy_static::lazy_static;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};
use tauri::{AppHandle, Manager};

pub fn restore_and_focus_window(app: &AppHandle, window_name: &str) {
    if let Some(window) = app.get_webview_window(window_name) {
        window.unminimize().unwrap(); // 恢复窗口，如果它被最小化
        window.show().unwrap();
        window.set_focus().unwrap();
    }
}

lazy_static! {
    pub static ref OBSERVER: Arc<Observer> = Arc::new(Observer::new());
    pub static ref CURRENT_LANG: Mutex<String> = Mutex::new("en".to_string());
    pub static ref IS_SHOW_TOOLBAR: Mutex<bool> = Mutex::new(false);
}

// 定义回调函数类型，回调函数接受一个 String 参数并返回空。
pub type Callback = Box<dyn Fn(NotifyMessage) + Send + Sync>;

/// 定义观察者结构体，用于存储回调函数。
pub struct Observer {
    callbacks: Mutex<HashMap<String, Callback>>,
}

#[derive(Clone)]
pub enum NotifyMessage {
    // 控制当前语言
    CurrentLang(String),
    // 控制是否显示工具栏
    IsShowToolbar(bool),
}

impl Observer {
    // 构造函数，创建一个新的 Observer 实例。
    fn new() -> Self {
        Observer {
            callbacks: Mutex::new(HashMap::new()),
        }
    }

    // 订阅方法，添加一个新的回调函数。
    pub fn subscribe(&self, id: String, callback: Callback) {
        let mut callbacks = self.callbacks.lock().unwrap();
        callbacks.insert(id, callback);
    }

    // 通知方法，调用所有已订阅的回调函数。
    pub fn notify(&self, msg: NotifyMessage) {
        let callbacks = self.callbacks.lock().unwrap();
        for callback in callbacks.values() {
            callback(msg.clone());
        }
    }
}

/// 设置当前语言并通知观察者
pub fn set_current_lang(lang: &str) {
    let mut current_lang = CURRENT_LANG.lock().unwrap();
    *current_lang = lang.to_string();
    return OBSERVER.notify(NotifyMessage::CurrentLang(current_lang.clone()));
}

/// 获取当前语言
pub fn get_current_lang() -> String {
    let current_lang = CURRENT_LANG.lock().unwrap();
    return current_lang.clone();
}

/// 订阅语言变化的回调函数。
pub fn subscribe_to_lang_change(id: String, callback: Callback) {
    return OBSERVER.subscribe(id, callback);
}

/// 设置是否显示工具栏并通知观察者。
pub fn set_current_show_toolbar(is_show_toolbar: &bool) {
    let mut current_toolbar = IS_SHOW_TOOLBAR.lock().unwrap();
    *current_toolbar = is_show_toolbar.clone();
    return OBSERVER.notify(NotifyMessage::IsShowToolbar(current_toolbar.clone()));
}

/// 获取是否显示工具栏。
pub fn get_current_show_toolbar() -> bool {
    let current_toolbar: std::sync::MutexGuard<'_, bool> = IS_SHOW_TOOLBAR.lock().unwrap();
    return current_toolbar.clone();
}

// 订阅工具栏变化的回调函数。
pub fn subscribe_to_show_toolbar_change(id: String, callback: Callback) {
    return OBSERVER.subscribe(id, callback);
}
