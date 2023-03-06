const { dialog, app, BrowserWindow } = require('electron')

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.loadFile('index.html');
    return win;
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    const mainWindow = createWindow()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
    mainWindow.on('close', function(e) {
        e.preventDefault();
        dialog.showMessageBox({
            type: 'info',
            title: '提示',
            message:'确认退出？',
            buttons: ['确认', '取消'],
            cancelId: 1,
        }).then(idx => {
            if (idx.response == 1) {
                e.preventDefault();
            } else {
                mainWindow.destroy();
            }
        })
    })
})

app.on('window-all-closed', function () {
    // if (process.platform !== 'darwin') app.quit()
    app.quit()
})
