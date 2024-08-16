import { app } from "electron";
import { loadTileset } from "./TilesetLoader";
import { loadGameData } from "./DataLoader";
import { loadI18NData } from "./I18NLoader";




export const FuncObj = {
    loadTileset, loadGameData,loadI18NData,
    getAppPath() {
        return app.getAppPath();
    },
    test(){
        return 0;
    },
};
export type FuncObj = typeof FuncObj;