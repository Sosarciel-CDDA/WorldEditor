import { CHUNK_SIZE } from "@/src/compoent/GlobalContext";
import { PRecord } from "@zwa73/utils";
import { Chunk, ChunkSlotDataMap } from "./Chunk";
import { TileSlotPos, TileSlotData } from "./TileSlot";
import { PixiNode } from "./PixiInterface";

export function parseSlotPos(pos:TileSlotPos){
    return {
        x:CHUNK_SIZE.width*pos.chunkX+pos.tileX,
        y:CHUNK_SIZE.height*pos.chunkY+pos.tileY
    };
}

export type ZoneMapPos = {
    tileWidth:number;
    tileHeight:number;
    minChunkX:number;
    maxChunkX:number;
    minChunkY:number;
    maxChunkY:number;
    minChunkZ?:number;
    maxChunkZ?:number;
}

/**x_y_z */
export type PosKey3D = `${number}_${number}_${number}`;
/**x_y */
export type PosKey2D = `${number}_${number}`;
export type ZoneChunkDataMap = PRecord<PosKey3D,ChunkSlotDataMap>;
type ZoneMapProps = {
    pos:ZoneMapPos;
    chunkDataMap?:ZoneChunkDataMap;
}
export class ZoneMap extends PixiNode<ZoneMap,Chunk,ZoneChunkDataMap>{
    private pos:ZoneMapPos;
    currZ = null as any as number;
    //private ChunkTable:Record<ChunkKey,Chunk>;
    constructor(props:ZoneMapProps){
        super(props.chunkDataMap??{});
        this.pos = props.pos;
        this.init();
    }
    getSlotByWorldPos(x:number,y:number,z:number=this.currZ){
        const pos = this.parseGlobalPos(x,y);
        const chunk = this.getChunk(pos.chunkX,pos.chunkY,z);
        if(chunk==undefined) return;
        return chunk.getSlot(pos.tileX,pos.tileY);
    }
    async setSlotByWorldPos(data:TileSlotData|undefined,x:number,y:number,z:number=this.currZ){
        const pos = this.parseGlobalPos(x,y);
        const chunk = this.getChunk(pos.chunkX,pos.chunkY,z);
        if(chunk==undefined) return;
        return chunk.setSlot(data,pos.tileX,pos.tileY);
    }
    getChunk(x:number,y:number,z:number=this.currZ){
        return this.getChild(`${x}_${y}_${z}` as any);
    }
    async init(z:number=0){
        if(this.currZ==z) return;
        this.currZ = z;
        this.destoryChildren();
        const {maxChunkY,maxChunkX,minChunkX,minChunkY,tileWidth,tileHeight} = this.pos;
        for(let chunkX = minChunkX;chunkX<=maxChunkX;chunkX++){
            for(let chunkY = minChunkY;chunkY<=maxChunkY;chunkY++){
                const cx = chunkX;
                const cy = chunkY;
                const key = `${cx}_${cy}_${z}` as const;
                const chunk = new Chunk({
                    pos:{ chunkX:cx, chunkY:cy, tileHeight, tileWidth },
                    slotDataMap:this.dataTable[key],
                });
                this.setChild(key,chunk);
            }
        }
    }
    parseGlobalPos(x:number,y:number){
        const cw = CHUNK_SIZE.width*this.pos.tileWidth;
        const ch = CHUNK_SIZE.height*this.pos.tileHeight;
        return {
            chunkX : Math.floor(x/cw),
            chunkY : Math.floor(y/ch),
            tileX  : Math.floor(x%cw/this.pos.tileWidth),
            tileY  : Math.floor(y%ch/this.pos.tileHeight),
            x,y
        };
    }
}