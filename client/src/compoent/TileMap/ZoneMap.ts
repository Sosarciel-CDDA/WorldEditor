import { CHUNK_SIZE } from "@/src/compoent/GlobalContext";
import { PRecord } from "@zwa73/utils";
import * as PIXI from 'pixi.js';
import { Chunk, ChunkSlotDataMap } from "./Chunk";
import { TileSlotPos, TileSpriteData } from "./TileSlot";

export function parseSlotPos(pos:TileSlotPos){
    return {
        x:CHUNK_SIZE.width*pos.chunkX+pos.tileX,
        y:CHUNK_SIZE.height*pos.chunkY+pos.tileY
    }
}

export type ZoneMapData = {
    tileWidth:number;
    tileHeight:number;
    minChunkX:number;
    maxChunkX:number;
    minChunkY:number;
    maxChunkY:number;
    minChunkZ?:number;
    maxChunkZ?:number;
}


export type PixiObject = {
    getNode():Promise<PIXI.Container>|PIXI.Container;
}


/**x_y_z */
export type PosKey3D = `${number}_${number}_${number}`;
/**x_y */
export type PosKey2D = `${number}_${number}`;
export type ZoneChunkDataMap = PRecord<PosKey3D,ChunkSlotDataMap>;
export type ZoneMapProps = {
    data:ZoneMapData;
    chunkDataMap?:ZoneChunkDataMap;
}
export class ZoneMap implements PixiObject{
    inited:Promise<void>;
    private node:PIXI.Container;
    private data:ZoneMapData;
    private chunkTable:PRecord<PosKey3D,Chunk>={};
    private chunkDataMap:ZoneChunkDataMap={};
    currZ = null as any as number;
    //private ChunkTable:Record<ChunkKey,Chunk>;
    constructor(props:ZoneMapProps){
        const {data,chunkDataMap} = props;
        this.chunkDataMap = chunkDataMap??{};
        const {maxChunkY,maxChunkX,minChunkX,minChunkY,tileWidth,tileHeight} = data;
        const mapWidth = maxChunkX-minChunkX+1;
        const mapHeight = maxChunkY-minChunkY+1;
        const node = new PIXI.Container();
        this.node = node;
        this.data = data;
        this.inited = this.init();
    }
    getSlotByWorldPos(x:number,y:number,z:number=this.currZ){
        const pos = this.parseGlobalPos(x,y);
        //console.log(pos);
        const chunk = this.getChunk(pos.chunkX,pos.chunkY,z);
        if(chunk==undefined) return;
        return chunk.getSlot(pos.tileX,pos.tileY);
    }
    setSlotByWorldPos(data:TileSpriteData|undefined,x:number,y:number,z:number=this.currZ){
        const pos = this.parseGlobalPos(x,y);
        //console.log(pos);
        const chunk = this.getChunk(pos.chunkX,pos.chunkY,z);
        if(chunk==undefined) return;
        return chunk.setSlot(data,pos.tileX,pos.tileY);
    }
    getChunk(x:number,y:number,z:number=this.currZ){
        return this.chunkTable[`${x}_${y}_${z}`];
    }
    getNode(){
        return this.node;
    }
    async init(z:number=0){
        if(this.currZ==z) return;
        this.currZ = z;
        this.node.removeChildren().forEach(s=>s.destroy({
            children:true,
            context:true,
            style:true,
            texture:true,
        }));
        this.chunkTable = {};
        const {maxChunkY,maxChunkX,minChunkX,minChunkY,tileWidth,tileHeight} = this.data;
        const plist:Promise<PIXI.Container>[] = [];
        for(let chunkX = minChunkX;chunkX<=maxChunkX;chunkX++){
            for(let chunkY = minChunkY;chunkY<=maxChunkY;chunkY++){
                const cx = chunkX;
                const cy = chunkY;
                const chunk = new Chunk({
                    pos:{ chunkX:cx, chunkY:cy, tileHeight, tileWidth },
                    slotDataMap:this.chunkDataMap[`${cx}_${cy}_${z}`],
                });
                this.chunkTable[`${cx}_${cy}_${z}`] = chunk;
                //console.log('chunk',`${chunkX}_${chunkY}_0`,chunkDataMap?.[`${chunkX}_${chunkY}_0`]);
                plist.push(chunk.getNode());
            }
        }
        const chunk = (await Promise.all(plist));
        this.node.addChild(...chunk);
    }
    parseGlobalPos(x:number,y:number){
        const cw = CHUNK_SIZE.width*this.data.tileWidth;
        const ch = CHUNK_SIZE.height*this.data.tileHeight;
        return {
            chunkX : Math.floor(x/cw),
            chunkY : Math.floor(y/ch),
            tileX  : Math.floor(x%cw/this.data.tileWidth),
            tileY  : Math.floor(y%ch/this.data.tileHeight),
            x,y
        }
    }
}