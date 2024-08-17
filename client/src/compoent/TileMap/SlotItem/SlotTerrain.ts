import { PixiUnit } from "../PixiInterface";
import * as PIXI from 'pixi.js';
import { AnySpriteData, getSprite } from "./Util";
import { TileSlotPos } from "../TileSlot";




export class SlotTerrain extends PixiUnit<SlotTerrain,AnySpriteData>{
    constructor(data:AnySpriteData,pos:TileSlotPos){
        const node = new PIXI.Container;
        super(data,node);
        getSprite(data,pos)
            .then(s=>node.addChild(s));
    }
}