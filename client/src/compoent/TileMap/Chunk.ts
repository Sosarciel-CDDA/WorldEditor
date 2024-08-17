import { PRecord } from '@zwa73/utils';
import * as PIXI from 'pixi.js';
import { PosKey2D } from './ZoneMap';
import { CHUNK_SIZE } from '../GlobalContext';
import { TileSlotData,TileSlot } from './TileSlot';
import { PixiNode } from './PixiInterface';


export type ChunkSlotDataMap = PRecord<`${number}_${number}`,TileSlotData>;


type ChunkPos = {
    tileWidth:number;
    tileHeight:number;
    chunkX:number;
    chunkY:number;
}
type ChunkProps = {
    pos:ChunkPos;
    slotDataMap?:ChunkSlotDataMap;
}

export class Chunk extends PixiNode<Chunk,TileSlot,ChunkSlotDataMap>{
    private pos;
    constructor(prop:ChunkProps){
        const {pos,slotDataMap} = prop;
        const fixedData = slotDataMap??{};
        super(fixedData,new PIXI.Container());
        this.pos=pos;
        this.init(pos);
    }
    init(pos:ChunkPos){
        //区块偏移
        this.node.x = pos.chunkX * CHUNK_SIZE.width * pos.tileWidth;
        this.node.y = pos.chunkY * CHUNK_SIZE.height * pos.tileHeight;
        for (let tileX = 0; tileX < CHUNK_SIZE.width; tileX++) {
            for (let tileY = 0; tileY < CHUNK_SIZE.height; tileY++) {
                const cx = tileX;
                const cy = tileY;
                const key = `${cx}_${cy}` as const;
                const td = this.dataTable?.[key];
                const tile = new TileSlot({
                    pos:{tileX:cx,tileY:cy,...pos},
                    data:td,
                });
                this.setChild(key,tile);
            }
        }
    }
    getSlot(x:number,y:number){
        return this.getChild(`${x}_${y}`);
    }
    async setSlot(data:TileSlotData|undefined,x:number,y:number){
        const slot = this.getSlot(x,y);
        if(slot==undefined) return;
        const newSlot = new TileSlot({
            pos:{tileX:x,tileY:y,...this.pos},data,
        });
        this.setChild(`${x}_${y}`,newSlot);
    }
}