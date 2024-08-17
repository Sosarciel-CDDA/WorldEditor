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
        //console.time('bridge loadTileset');
        const out = await ipcRenderer.invoke('loadTileset',gamePath,gfxName);
        //console.timeEnd('bridge loadTileset');
        return out;
    },
    loadGameData: async (gamePath) => {
        //console.time('bridge loadGameData');
        const out = await ipcRenderer.invoke('loadGameData',gamePath);
        //console.timeEnd('bridge loadGameData');
        return out;
    },
    loadI18NData: async (gamePath,langFlag)=>{
        //console.time('bridge loadI18NData');
        const out = await ipcRenderer.invoke('loadI18NData',gamePath,langFlag);
        //console.timeEnd('bridge loadI18NData');
        return out;
    }
};

contextBridge.exposeInMainWorld('electron', BridgeBase);


