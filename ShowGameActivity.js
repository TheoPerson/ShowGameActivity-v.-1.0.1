/**
 * @name ShowGameActivity
 * @author JUG_SEC
 * @authorId 630820742031736845
 * @version 1.0.1
 * @description Adds a Quick-Toggle Game Activity Button - JUG_SEC : jugsec.com
 * @invite iT8efrpX
 * @donate https://www.paypal.me/kixtero
 * @website https://jugsec.com/
 * @source https://github.com/TheoPerson/ShowGameActivity.git
 * @updateUrl -
 */

module.exports = (() => {
    const changeLog = {
        
    };
    
    return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
        constructor (meta) {for (let key in meta) this[key] = meta[key];}
        getName () {return this.name;}
        getAuthor () {return this.author;}
        getVersion () {return this.version;}
        getDescription () {return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`;}
        
        downloadLibrary () {
            BdApi.Net.fetch("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js").then(r => {
                if (!r || r.status != 200) throw new Error();
                else return r.text();
            }).then(b => {
                if (!b) throw new Error();
                else return require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
            }).catch(error => {
                BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
            });
        }
        
        load () {
            if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
            if (!window.BDFDB_Global.downloadModal) {
                window.BDFDB_Global.downloadModal = true;
                BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
                    onConfirm: _ => {
                        delete window.BDFDB_Global.downloadModal;
                        this.downloadLibrary();
                    }
                });
            }
            if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
        }
        start () {this.load();}
        stop () {}
        getSettingsPanel () {
            let template = document.createElement("template");
            template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
            template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
            return template.content.firstElementChild;
        }
    } : (([Plugin, BDFDB]) => {
        var _this;
        var toggleButton;
        
        const ActivityToggleComponent = class ActivityToggle extends BdApi.React.Component {
            componentDidMount() {
                toggleButton = this;
            }
            render() {
                const enabled = this.props.forceState != undefined ? this.props.forceState : BDFDB.DiscordUtils.getSetting("status", "showCurrentGame");
                delete this.props.forceState;
                return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.PanelButton, Object.assign({}, this.props, {
                    tooltipText: enabled ? _this.labels.disable_activity : _this.labels.enable_activity,
                    icon: iconProps => BDFDB.ReactUtils.createElement("div", {
                        className: BDFDB.disCN.lottieicon,
                        style: {
                            "--__lottieIconColor": enabled ? "currentColor" : BDFDB.DiscordConstants.ColorsCSS.STATUS_DANGER,
                            "display": "flex",
                            "width": "20px",
                            "height": "20px"
                        },
                        children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, Object.assign({}, iconProps, {
                            nativeClass: true,
                            width: 20,
                            height: 20,
                            color: "var(--__lottieIconColor)",
                            name: enabled ? BDFDB.LibraryComponents.SvgIcon.Names.GAMEPAD : BDFDB.LibraryComponents.SvgIcon.Names.GAMEPAD_DISABLED
                        }))
                    }),
                    onClick: _ => _this.toggle()
                }));
            }
        };
        
        var sounds = [], keybind;
        
        return class GameActivityToggle extends Plugin {
            onLoad () {
                _this = this;
                
                this.defaults = {
                    general: {
                        showButton:         {value: true,                description: "Show Quick Toggle Button"},
                        showItem:           {value: false,               description: "Show Quick Toggle Item"},
                        playEnable:         {value: true,                description: "Play Enable Sound"},
                        playDisable:        {value: true,                description: "Play Disable Sound"}
                    },
                    selections: {
                        enableSound:        {value: "stream_started",    description: "Enable Sound"},
                        disableSound:       {value: "stream_ended",      description: "Disable Sound"}
                    }
                };
                
                this.modulePatches = {
                    before: [
                        "Menu"
                    ],
                    after: [
                        "Account"
                    ]
                };
                
                this.css = `
                    ${BDFDB.dotCNS._gameactivitytoggleadded + BDFDB.dotCNC.accountinfowithtagasbutton + BDFDB.dotCNS._gameactivitytoggleadded + BDFDB.dotCN.accountinfowithtagless} {
                        flex: 1;
                        min-width: 0;
                    }
                `;
            }
            
            onStart () {
                sounds = [BDFDB.LibraryModules.SoundParser && BDFDB.LibraryModules.SoundParser.keys()].flat(10).filter(n => n).map(s => s.replace("./", "").split(".")[0]).sort();
                
                let cachedState = BDFDB.DataUtils.load(this, "cachedState");
                let state = BDFDB.DiscordUtils.getSetting("status", "showCurrentGame");
                if (!cachedState.date || (new Date() - cachedState.date) > 1000*60*60*24*3) {
                    cachedState.value = state;
                    cachedState.date = new Date();
                    BDFDB.DataUtils.save(cachedState, this, "cachedState");
                }
                else if (cachedState.value != null && cachedState.value != state) BDFDB.DiscordUtils.setSetting("status", "showCurrentGame", cachedState.value);
                
                let SettingsStore = BDFDB.DiscordUtils.getSettingsStore();
                if (SettingsStore) BDFDB.PatchUtils.patch(this, SettingsStore, "updateAsync", {after: e => {
                    if (e.methodArguments[0] != "status") return;
                    let newSettings = {value: undefined};
                    e.methodArguments[1](newSettings);
                    if (newSettings.showCurrentGame != undefined) {
                        if (toggleButton) toggleButton.props.forceState = newSettings.showCurrentGame.value;
                        BDFDB.ReactUtils.forceUpdate(toggleButton);
                        BDFDB.DataUtils.save({date: new Date(), value: newSettings.showCurrentGame.value}, this, "cachedState");
                    }
                }});
                
                keybind = BDFDB.DataUtils.load(this, "keybind");
                keybind = BDFDB.ArrayUtils.is(keybind) ? keybind : [];
                this.activateKeybind();
                
                BDFDB.DiscordUtils.rerenderAll();
            }
            
            onStop () {
                BDFDB.DiscordUtils.rerenderAll();
            }

            getSettingsPanel (collapseStates = {}) {
                let settingsPanel;
                return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, {
                    collapseStates: collapseStates,
                    children: _ => {
                        let settingsItems = [];
                        
                        for (let key in this.defaults.general) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
                            type: "Switch",
                            plugin: this,
                            keys: ["general", key],
                            label: this.defaults.general[key].description,
                            value: this.settings.general[key]
                        }));
                        
                        for (let key in this.defaults.selections) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
                            type: "Select",
                            plugin: this,
                            keys: ["selections", key],
                            label: this.defaults.selections[key].description,
                            basis: "50%",
                            options: sounds.map(o => ({value: o, label: o.split(/[-_]/g).map(BDFDB.StringUtils.upperCaseFirstChar).join(" ")})),
                            value: this.settings.selections[key],
                            onChange: value => BDFDB.LibraryModules.SoundUtils.playSound(value, .4)
                        }));
                        
                        settingsItems.push(BDFDB.ReactUtils.createElement("div", {
                            className: BDFDB.disCN.settingsrowcontainer,
                            children: BDFDB.ReactUtils.createElement("div", {
                                className: BDFDB.disCN.settingsrowlabel,
                                children: [
                                    BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
                                        label: "Global Hotkey"
                                    }),
                                    BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex.Child, {
                                        className: BDFDB.disCNS.settingsrowcontrol + BDFDB.disCN.flexchild,
                                        grow: 0,
                                        wrap: true,
                                        children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.KeybindRecorder, {
                                            value: !keybind ? [] : keybind,
                                            reset: true,
                                            onChange: value => {
                                                keybind = value;
                                                BDFDB.DataUtils.save(keybind, this, "keybind")
                                                this.activateKeybind();
                                            }
                                        })
                                    })
                                ].flat(10).filter(n => n)
                            })
                        }));
                        
                        return settingsItems;
                    }
                });
            }
            
            processMenu (e) {
                if (!this.settings.general.showItem || e.instance.props.navId != "account") return;
                let [_, oldIndex] = BDFDB.ContextMenuUtils.findItem(e.instance, {id: BDFDB.ContextMenuUtils.createItemId(this.name, "activity-toggle")});
                if (oldIndex > -1) return;
                let [children, index] = BDFDB.ContextMenuUtils.findItem(e.instance, {id: ["custom-status", "set-custom-status", "edit-custom-status"]});
                if (index > -1) {
                    let isChecked = BDFDB.DiscordUtils.getSetting("status", "showCurrentGame");
                    children.push(BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuCheckboxItem, {
                        label: BDFDB.LanguageUtils.LanguageStrings.ACTIVITY_STATUS,
                        id: BDFDB.ContextMenuUtils.createItemId(this.name, "activity-toggle"),
                        icon: _ => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.MenuItems.MenuIcon, {
                            icon: BDFDB.LibraryComponents.SvgIcon.Names.GAMEPAD
                        }),
                        showIconFirst: true,
                        checked: isChecked,
                        action: _ => this.toggle()
                    }));
                }
            }
            
            processAccount (e) {
                if (!this.settings.general.showButton) return;
                let accountinfo = BDFDB.ReactUtils.findChild(e.returnvalue, {props: [["className", BDFDB.disCN.accountinfo]]});
                let children = accountinfo && BDFDB.ObjectUtils.get(accountinfo, "props.children.1.props.children");
                if (children && children.length && BDFDB.ArrayUtils.is(children)) {
                    accountinfo.props.className = BDFDB.DOMUtils.formatClassName(accountinfo.props.className, BDFDB.disCN._gameactivitytoggleadded);
                    children.unshift(BDFDB.ReactUtils.createElement(ActivityToggleComponent, {}));
                }
            }
            
            activateKeybind () {
                if (keybind && keybind.length) BDFDB.ListenerUtils.addGlobal(this, "GAMEACTIVITY_TOGGLE", keybind, _ => this.toggle());
                else BDFDB.ListenerUtils.removeGlobal(this, "GAMEACTIVITY_TOGGLE");
            }
            
            toggle () {
                const shouldEnable = !BDFDB.DiscordUtils.getSetting("status", "showCurrentGame");
                this.settings.general[shouldEnable ? "playEnable" : "playDisable"] && BDFDB.LibraryModules.SoundUtils.playSound(this.settings.selections[shouldEnable ? "enableSound" : "disableSound"], .4);
                BDFDB.DiscordUtils.setSetting("status", "showCurrentGame", shouldEnable);
            }
        };
    })(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();
