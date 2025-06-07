import { PixiUnit } from "../PixiInterface";
import * as PIXI from 'pixi.js';
import { AnySpriteData, getSprite } from "./Util";
import { TileSlotPos } from "../TileSlot";




export class SlotSprite extends PixiUnit<SlotSprite,AnySpriteData>{
    constructor(data:AnySpriteData,pos:TileSlotPos){
        const node = new PIXI.Container;
        super(data,node);
        getSprite(data,pos)
            .then(s=>node.addChild(s))
            .catch(err=>{throw new Error(`SlotSprite getSprite error: ${err}`);});
    }
}