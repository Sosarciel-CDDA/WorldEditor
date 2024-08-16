import { PRecord } from '@zwa73/utils';
import * as PIXI from 'pixi.js';
import { PixiObject, PosKey2D } from './ZoneMap';
import { CHUNK_SIZE } from '../GlobalContext';
import { TileSpriteData,TileSlot } from './TileSlot';


export type ChunkSlotDataMap = PRecord<`${number}_${number}`,TileSpriteData>;


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

export class Chunk implements PixiObject{
    private node;
    private slotTable:PRecord<PosKey2D,TileSlot>={};
    private slotDataMap:ChunkSlotDataMap={};
    private pos;
    inited:Promise<void>;
    constructor(prop:ChunkProps){
        const {pos,slotDataMap} = prop;
        this.pos=pos;
        this.slotDataMap=slotDataMap??{};

        const node = new PIXI.Container();
        this.node = node;
        node.x = pos.chunkX * CHUNK_SIZE.width * pos.tileWidth;
        node.y = pos.chunkY * CHUNK_SIZE.height * pos.tileHeight;
        this.inited=(async ()=>{
            const plist:Promise<PIXI.Container>[] = [];
            for (let tileX = 0; tileX < CHUNK_SIZE.width; tileX++) {
                for (let tileY = 0; tileY < CHUNK_SIZE.height; tileY++) {
                    const cx = tileX;
                    const cy = tileY;
                    const key = `${cx}_${cy}` as const;
                    const td = slotDataMap?.[key];
                    const tile = new TileSlot({
                        pos:{tileX:cx,tileY:cy,...pos},
                        data:td,
                    });
                    this.slotTable[key] = tile;
                    plist.push(tile.getNode());
                }
            }
            const slots = await Promise.all(plist);
            node.addChild(...slots);
            //console.log('withChunk',slots);
        })();
    }
    async getNode() {
        await this.inited;
        return this.node;
    }
    getSlot(x:number,y:number){
        return this.slotTable[`${x}_${y}`];
    }
    async setSlot(data:TileSpriteData|undefined,x:number,y:number){
        const slot = this.getSlot(x,y);
        if(slot==undefined) return;
        this.slotDataMap[`${x}_${y}`] = data;

        const node = await this.getNode();
        (await slot.getNode()).destroy({
            children:true,
            context:true,
            style:true,
            texture:true,
        });
        const newSlot = new TileSlot({
            pos:{tileX:x,tileY:y,...this.pos},data,
        });
        this.slotTable[`${x}_${y}`] = newSlot;
        node.addChild(await newSlot.getNode());
    }
}