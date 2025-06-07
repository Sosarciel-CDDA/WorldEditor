import { AnyMapgen, Mapgen, OverMapSpecial, OvermapTerrainID, Palette, TerrainID } from "@sosarciel-cdda/schema";
import { CHUNK_SIZE } from "./GlobalContext";
import { GameDataTable } from "../static/DataLoader";
import { ChunkSlotDataMap } from "./TileMap/Chunk";
import { TileSlotData, ZoneChunkDataMap } from "./TileMap";
import { SpriteData, TilesetData } from "@/src/static/TilesetLoader";
import { PRecord } from "@zwa73/utils";
import * as PIXI from 'pixi.js';

/**打印警告 */
export function pwarn(...dat:any[]){
    return console.log(...dat);
}

const omterrainIDMap:PRecord<string,Mapgen> = {};
/**预处理omterrain */
export const remapOMTerrainID = (mapgen:AnyMapgen[])=>{
    mapgen.filter(t=>'om_terrain' in t)
        .forEach(t => {
            const fixt = t as Mapgen;
            const omlist = typeof fixt.om_terrain == 'string'
                ? [fixt.om_terrain] : fixt.om_terrain.flat(Infinity);
            //if(omlist.includes('p_resort_1ne')) console.log('includes(p_resort_1ne)');
            omlist.forEach(id => omterrainIDMap[id as string]=fixt);
        });
};
/**获取 overmap special 地图大小 */
export const getOMSSize = (oms:OverMapSpecial)=>{
    const size = {
        minChunkX:0,
        maxChunkX:0,
        minChunkY:0,
        maxChunkY:0,
        minChunkZ:0,
        maxChunkZ:0,
    };
    oms.overmaps.forEach(o=>{
        const [x,y,z] = o.point;
        size.maxChunkX = Math.max(x,size.maxChunkX);
        size.minChunkX = Math.min(x,size.minChunkX);
        size.maxChunkY = Math.max(y,size.maxChunkY);
        size.minChunkY = Math.min(y,size.minChunkY);
        size.maxChunkZ = Math.max(z,size.maxChunkZ);
        size.minChunkZ = Math.min(z,size.minChunkZ);
    });
    return size;
};


/**omtid : platte */
const PaletteTemp:PRecord<string,MergedPalette>={};
function mergePaletteKey<K extends (keyof Palette&keyof Mapgen['object'])>
    (key:K,mapgen:Mapgen,palettes:Palette[]){
    const inline = mapgen.object[key] ?? {}as NonNullable<Palette[K]>;
    const ps = palettes.map(p=>p[key]).filter(p=>p!=undefined);
    return Object.assign({},...ps,inline) as NonNullable<Palette[K]>;
}
const DefPalette = {
    terrain:{},
    furniture:{},
    items:{},
    liquids:{},
    monster:{},
    nested:{},
    vehicles:{}
};
type MergedPalette = Required<Omit<Palette,'id'|'type'>>;
function getPalette(id:OvermapTerrainID,gd:GameDataTable):MergedPalette{
    if(PaletteTemp[id]!=null) return PaletteTemp[id]!;
    const dat = omterrainIDMap[id];
    if(dat==null){
        pwarn(`can't find palette data ${id}`);
        return DefPalette;
    }
    const palettes = dat.object.palettes
        ? dat.object.palettes
            .map(pid=>gd.Palette[pid])
            .filter(t=>t!=undefined) as Palette[]
        : [];
    const out = Object.assign({},DefPalette,{
        terrain     :mergePaletteKey('terrain'  ,dat,palettes),
        furniture   :mergePaletteKey('furniture',dat,palettes),
        items       :mergePaletteKey('items'    ,dat,palettes),
        liquids     :mergePaletteKey('liquids'  ,dat,palettes),
        monster     :mergePaletteKey('monster'  ,dat,palettes),
        nested      :mergePaletteKey('nested'   ,dat,palettes),
        vehicles    :mergePaletteKey('vehicles' ,dat,palettes),
    });
    PaletteTemp[id] = out;
    return out;
}


/**从调色板获取id */
function getPaletteToF<K extends 'furniture'|'terrain'>
    (key:K,char:string,palette:MergedPalette){
    const mapc = palette[key]?.[char];
    if(mapc==undefined) return;

    const tid = typeof mapc == 'string'
        ? mapc
        : typeof mapc[0] == 'string'
            ? mapc[0]
            : mapc[0][0];
    return tid;
}
/**将omtid转为ChunkSlotData */
export const getChunkSlotData = (id:OvermapTerrainID,gd:GameDataTable,td:TilesetData):ChunkSlotDataMap|undefined=>{
    const mapgen = omterrainIDMap[id];
    if(mapgen==null){
        pwarn(`can't find omt data ${id}`);
        return;
    }
    const inMapPos = {x:0,y:0};
    if(typeof mapgen.om_terrain != 'string'){
        const ylength = Array.isArray(mapgen.om_terrain[0])
            ? mapgen.om_terrain[0].length : mapgen.om_terrain.length;

        const list = mapgen.om_terrain.flat(Infinity);
        const i = list.indexOf(id);
        inMapPos.y = Math.floor(i/ylength);
        inMapPos.x = i%ylength;
    }

    const charMap = mapgen.object.rows;
    const yslice = charMap.slice(inMapPos.y*CHUNK_SIZE.height,(inMapPos.y+1)*CHUNK_SIZE.height);
    const overslice = yslice.map(s=>s.slice(inMapPos.x*CHUNK_SIZE.width,(inMapPos.x+1)*CHUNK_SIZE.width));

    const palette = getPalette(id,gd);

    const fillid = mapgen.object.fill_ter;
    const outmap:ChunkSlotDataMap = {};

    //填入调色板
    for(let y=0;y<overslice.length;y++){
        const row = overslice[y];
        for(let x=0;x<row.length;x++){
            const char = row[x];

            const slot:TileSlotData={};

            //地形
            const tid = getPaletteToF('terrain',char,palette);
            if(tid!=null) slot.terrain = td.table[tid]??{tileId:tid};
            else if(fillid!=null) slot.terrain = td.table[fillid]??{tileId:fillid};
            else pwarn(`can't find "${char}" in palette`);

            //家具
            const fid = getPaletteToF('furniture',char,palette);
            if(fid!=null) slot.furniture = td.table[fid]??{tileId:fid};

            outmap[`${x}_${y}`] = slot;
        }
    }

    //填入place
    mapgen.object.place_furniture?.forEach(pf=>{
        const {x,y,chance,furn} = pf;
        if(typeof x != 'number') return;
        if(typeof y != 'number') return;
        if(chance!=null) return;
        const slot = outmap[`${x}_${y}`]??={};
        slot.furniture=td.table[furn]??{tileId:furn};
    });

    return outmap;
};

/**将omsid转为ZoneChunkData */
export const getZoneChunkData = (id:OvermapTerrainID,gd:GameDataTable,td:TilesetData):ZoneChunkDataMap|undefined=>{
    const oms = gd.OvermapSpecial[id];
    if(oms==null){
        pwarn(`can't find oms data ${id}`);
        return;
    }
    const omslist = oms.overmaps;
    const outmap:ZoneChunkDataMap={};
    omslist.forEach(o=>{
        const [x,y,z] = o.point;
        const oidWd = o.overmap;
        if(oidWd==null) return;
        const match = oidWd.match(/^(.+?)_(north|south|east|west)$/);
        if(match==null){
            pwarn(`can't parse direction id ${oidWd}`);
            return;
        }
        const overmapTerrainID = match[1];
        const direction = match[2];
        outmap[`${x}_${y}_${z}`] = getChunkSlotData(overmapTerrainID,gd,td);
        //console.log(overmapTerrainID)
        //console.log(`${x}_${y}`)
        //console.log(outmap[`${x}_${y}`])
    });
    return outmap;
};


/**纹理文件资源缓存 */
const textureAssetTemp:Record<string,Promise<PIXI.Texture>>={};
/**纹理缓存 */
const spriteTextureTemp:Record<string,PIXI.Texture> = {};
export async function loadTextureAsset(fp:string){
    if(textureAssetTemp[fp]!=null) return textureAssetTemp[fp];
    textureAssetTemp[fp] = PIXI.Assets.load(fp) as Promise<PIXI.Texture>;
    return textureAssetTemp[fp];
}
export async function getSpriteTexture(data:Omit<SpriteData, "bg" | "tileId">){
    const {filepath,ofstx,ofsty,width,height,spriteId} = data;
    if(spriteTextureTemp[spriteId]!=null) return spriteTextureTemp[spriteId];
    const source = (await loadTextureAsset(filepath)).source;
    const frame = new PIXI.Rectangle(ofstx, ofsty, width, height);
    const texture = new PIXI.Texture({source, frame});
    spriteTextureTemp[spriteId] = texture;
    return texture;
}