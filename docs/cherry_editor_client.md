## 1、Background
Cherry-markdown has been open source for some time, and has received some feedback from developers. However, it is not easy to truly experience the charm of Cherry as it is still only a component. How wonderful it will be in the future still requires developers to make it great😊. With Cherry's ability we can develop a set of personal note management app, which sounds like a nice one! Re-cast cherry's glory, our bounden duty!

## 2、Planning
Since Typora charged, there had some voice for alternative apps in various communities, and the voice of users is always the loudest voice. On reflection, I think the first step in a note management solution for the Cherry-Markdown editor is to implement a desktop app that can be distributed.
### why electron
Based on a combination of development difficulty, community activity, and safety, we chose Electron for two reasons:
1. Electron has a powerful core. Cherry-markdown is a pure JS component. In order to touch its true power, we need a good run-time container for it. How do we reject Electron which contains a Chromium that was called "strongest browser in the universe"?
2. Strong community support. There are many apps developed based on Electron, among which vscode and Atom are the best. From this point, the capability of Electron is beyond doubt. At the same time, perfect documentation and a large number of open source projects also provide a guarantee for subsequent development.

### primary task

- [ ] basic editing ability support
- [ ] oss support
- [ ] local file manage support
- [ ] file/folder import and export

###  second round

- [ ] extension support
- [ ] user system
- [ ] file synchronization
- [ ] full-text search
- [ ] collaboration

### spark

- [ ] power link jump