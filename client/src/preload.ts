// preload.ts (预加载脚本)
import { contextBridge, ipcRenderer } from 'electron';
import { Bridge } from './index';


const BridgeBase:Bridge = {
    getAppPath: async () => {
        return await ipcRenderer.invoke('getAppPath');
    },
    test: async () => {
        return await ipcRenderer.invoke('test');
    },
    loadTileset: async (gamePath,gfxName) => {
        return await ipcRenderer.invoke('loadTileset',gamePath,gfxName);
    },
    loadGameData: async (gamePath) => {
        return await ipcRenderer.invoke('loadGameData',gamePath);
    },
    loadI18NData: async (gamePath,langFlag)=>{
        return await ipcRenderer.invoke('loadI18NData',gamePath,langFlag);
    }
};

contextBridge.exposeInMainWorld('electron', BridgeBase);


