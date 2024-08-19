import { AnySpriteData, SlotSprite } from './SlotItem';
import { PixiNode } from './PixiInterface';
import * as PIXI from 'pixi.js';
import { CanvasPanelRef } from '../CanvasPanel';
import { AnyFunc } from '@zwa73/utils';

export type TileSlotData = {
    terrain  ?:AnySpriteData;
    furniture?:AnySpriteData;
}
export type TileSlotPos = {
    tileX:number;
    tileY:number;
    chunkX:number;
    chunkY:number;
    tileWidth:number;
    tileHeight:number;
};
type TileSlotProps = {
    pos:TileSlotPos;
    data?:TileSlotData;
};
export class TileSlot extends PixiNode<TileSlot,SlotSprite,TileSlotData>{
    pos:TileSlotPos;
    constructor(props: TileSlotProps) {
        const {data,pos} = props;
        const fixedData = data??{};
        super(fixedData);
        this.pos=pos;
        this.init(pos);
    }
    init(pos:TileSlotPos){
        const td = this.dataTable.terrain;
        if(td!==undefined){
            const terrain = new SlotSprite(td,pos);
            this.setChild('terrain',terrain);
        }
        //console.log(this.node.children);
        const fd = this.dataTable.furniture;
        if(fd!==undefined){
            const furniture = new SlotSprite(fd,pos);
            this.setChild('furniture',furniture);
        }

        this.node.x = pos.tileX * pos.tileWidth;
        this.node.y = pos.tileY * pos.tileHeight;
    }
    getPos(){
        return this.pos;
    }

    currAnim?:AnyFunc;
    animTile?:PIXI.Graphics;
    fadeIn() {
        const app = CanvasPanelRef.current?.getData().app;
        if(app==null) return;
        if(this.animTile!=null) return;

        // 创建一个Tile
        this.animTile = new PIXI.Graphics();
        const tile = this.animTile!;
        tile.fill(0xFF0000);
        tile.rect(0, 0, this.pos.tileWidth, this.pos.tileHeight);
        tile.fill();
        tile.alpha = 0;
        this.node.addChild(tile);
        // 渐变显示
        const fadeInProcess:PIXI.TickerCallback<()=>void> = (ticker: PIXI.Ticker)=>{
            tile.alpha += 0.025 * ticker.deltaTime;
            if (tile.alpha >= 0.5) {
                tile.alpha = 0.5;
                app.ticker.remove(fadeInProcess);
            }
        }
        if(this.currAnim!=null) app.ticker.remove(this.currAnim);
        this.currAnim = fadeInProcess;
        app.ticker.add(fadeInProcess);
    }
    fadeOut() {
        const app = CanvasPanelRef.current?.getData().app;
        if(app==null) return;
        const tile = this.animTile;
        if(tile==null) return;
        if(this.animTile==null) return;

        // 渐变显示
        const fadeOutProcess:PIXI.TickerCallback<()=>void> = (ticker: PIXI.Ticker)=>{
            tile.alpha -= 0.05 * ticker.deltaTime;
            if (tile.alpha > 0) return;
            tile.alpha = 0;
            app.ticker.remove(fadeOutProcess);
            this.node
                .removeChild(tile)
                .destroy();
            this.animTile = undefined;
        }

        if(this.currAnim!=null) app.ticker.remove(this.currAnim);
        app.ticker.add(fadeOutProcess);
    }
}
