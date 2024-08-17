import { AnyMapgen, Mapgen, OverMapSpecial, OvermapTerrainID, TerrainID } from "cdda-schema";
import { CHUNK_SIZE, GVar } from "./GlobalContext";
import { GameDataTable } from "../static/DataLoader";
import { ChunkSlotDataMap } from "./TileMap/Chunk";
import { ZoneChunkDataMap } from "./TileMap";
import { SpriteData, TilesetData } from "@/src/static/TilesetLoader";
import { PRecord } from "@zwa73/utils";
import * as PIXI from 'pixi.js';


/**预处理omterrain */
export const remapOMTerrainID = (mapgen:AnyMapgen[])=>{
    const rmap = GVar.omterrainIDMap ??= {};
    mapgen.filter(t=>'om_terrain' in t)
        .forEach(t => {
            const fixt = t as Mapgen;
            const omlist = typeof fixt.om_terrain == 'string'
                ? [fixt.om_terrain] : fixt.om_terrain.flat(Infinity);
            //if(omlist.includes('p_resort_1ne')) console.log('includes(p_resort_1ne)');
            omlist.forEach(id => rmap[id as string]=fixt);
        });
}
/**获取 overmap special 地图大小 */
export const getOMSSize = (oms:OverMapSpecial)=>{
    const size = {
        minChunkX:0,
        maxChunkX:0,
        minChunkY:0,
        maxChunkY:0,
        minChunkZ:0,
        maxChunkZ:0,
    }
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

type PlatteTable = {
    terrain:PRecord<string,string>;
}
/**omtid : platte */
const PlatteTemp:PRecord<string,PlatteTable>={};
export function getPlatte(id:OvermapTerrainID,gd:GameDataTable){
    if(PlatteTemp[id]!=null) return PlatteTemp[id] as PlatteTable;
    if(GVar.omterrainIDMap ==null) return {terrain:{}};;
    const fulldata = GVar.omterrainIDMap;
    const dat = fulldata[id];
    if(dat==null) return {terrain:{}};
    const palettes = dat.object.palettes
        ? dat.object.palettes.map(pid=>gd.Palette[pid])
        : [];
    const terrainPalettes = palettes.map(p=>{
        if(p==null) return {};
        if(p.terrain==null) return {};
        return p.terrain;
    });
    const terrainMap:typeof terrainPalettes[number] = Object.assign({},...terrainPalettes,dat.object.terrain??{});
    return {terrain:terrainMap}
}

/**将omtid转为ChunkSlotData */
export const getChunkSlotData = (id:OvermapTerrainID,gd:GameDataTable,td:TilesetData):ChunkSlotDataMap|undefined=>{
    if(GVar.omterrainIDMap ==null) return;
    const fulldata = GVar.omterrainIDMap;
    const dat = fulldata[id];
    if(dat==null) return;
    const inMapPos = {x:0,y:0};
    if(typeof dat.om_terrain != 'string'){
        const ylength = Array.isArray(dat.om_terrain[0])
            ? dat.om_terrain[0].length : dat.om_terrain.length;

        const list = dat.om_terrain.flat(Infinity);
        const i = list.indexOf(id);
        inMapPos.y = Math.floor(i/ylength);
        inMapPos.x = i%ylength;
    }

    const charMap = dat.object.rows;
    const yslice = charMap.slice(inMapPos.y*CHUNK_SIZE.height,(inMapPos.y+1)*CHUNK_SIZE.height);
    const overslice = yslice.map(s=>s.slice(inMapPos.x*CHUNK_SIZE.width,(inMapPos.x+1)*CHUNK_SIZE.width));

    const platte = getPlatte(id,gd);

    const fill = dat.object.fill_ter;
    const outmap:ChunkSlotDataMap = {};
    for(let y=0;y<overslice.length;y++){
        const row = overslice[y];
        for(let x=0;x<row.length;x++){
            const char = row[x];
            const mapc = platte.terrain[char];
            if(mapc==null){
                if(fill==null) continue;
                outmap[`${x}_${y}`] = {terrain:td.table[fill]};
                continue;
            }
            const tid = typeof mapc == 'string'
                ? mapc
                : typeof mapc[0] == 'string'
                    ? mapc[0]
                    : mapc[0][0];
            outmap[`${x}_${y}`] = {terrain:td.table[tid]};
        }
    }
    return outmap;
}

/**将omsid转为ZoneChunkData */
export const getZoneChunkData = (id:OvermapTerrainID,gd:GameDataTable,td:TilesetData):ZoneChunkDataMap|undefined=>{
    const oms = gd.OvermapSpecial[id];
    if(oms==null) return;
    const omslist = oms.overmaps;
    const outmap:ZoneChunkDataMap={};
    omslist.forEach(o=>{
        const [x,y,z] = o.point;
        const oidWd = o.overmap;
        const match = oidWd.match(/^(.+?)_(north|south|east|west)$/);
        if(match==null) return;
        const overmapTerrainID = match[1];
        const direction = match[2];
        outmap[`${x}_${y}_${z}`] = getChunkSlotData(overmapTerrainID,gd,td);
        //console.log(overmapTerrainID)
        //console.log(`${x}_${y}`)
        //console.log(outmap[`${x}_${y}`])
    });
    return outmap;
}


/**纹理文件资源缓存 */
const textureAssetTemp:Record<string,Promise<PIXI.Texture>>={};
/**纹理缓存 */
const spriteTextureTemp:Record<string,PIXI.Texture> = {};
export async function loadTextureAsset(fp:string){
    if(textureAssetTemp[fp]!=null) return textureAssetTemp[fp];
    textureAssetTemp[fp] = PIXI.Assets.load(fp) as Promise<PIXI.Texture>;
    return textureAssetTemp[fp];
}
export async function getSpriteTexture(data:SpriteData){
    const {filepath,ofstx,ofsty,width,height,spriteId} = data;
    if(spriteTextureTemp[spriteId]!=null) return spriteTextureTemp[spriteId];
    const source = (await loadTextureAsset(filepath)).source;
    const frame = new PIXI.Rectangle(ofstx, ofsty, width, height);
    const texture = new PIXI.Texture({source, frame});
    spriteTextureTemp[spriteId] = texture;
    return texture;
}