import { app, IpcMainInvokeEvent } from "electron";
import { loadTileset } from "./TilesetLoader";
import { loadGameData } from "./DataLoader";
import { loadI18NData } from "./I18NLoader";
import type { AllExtends, JToken } from "@zwa73/utils";


/**桥函数化 */
const bridgeify = <F extends (...args: any[]) => any>(func:F):
    F extends (...args:infer IN)=>infer OUT
        ? AllExtends<IN,JToken> extends true
            ? OUT extends JToken|void|Promise<JToken|void>
                ? (e:IpcMainInvokeEvent,...args:Parameters<F>)=>ReturnType<F>
                : Error&"返回值无法序列化"
            : Error&"传入值无法序列化"
        : never =>
    ((e:IpcMainInvokeEvent,...args:Parameters<F>):ReturnType<F>=>
        (func as any)(...args)) as any;

export const BridgeBackend = {
    loadTileset, loadGameData,loadI18NData,
    getAppPath() {
        return app.getAppPath();
    },
    test(){
        return 0;
    },
};
export type BridgeBackend = typeof BridgeBackend;

//断言确保桥符合类型
const assertBridge = <
    T extends {
        [key in string|number|symbol]: (arg1: IpcMainInvokeEvent, ...args: any[]) => any;
    } & { getBridgeKeys?: never } >(t:T) => undefined;
assertBridge(BridgeBackend);

export * from './DataLoader';
