import { Bridge } from "./index";




export const BridgeHelper:Bridge = {} as any;
for (const key in (window as any).electron)
    (BridgeHelper as any)[key] = (window as any).electron[key];

