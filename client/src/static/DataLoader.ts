import { AnyFunc, PRecord, UtilFT } from "@zwa73/utils";
import { AnyCddaJson, AnyItem, AnyMapgen, Monster, OverMapSpecial, Palette, Terrain } from "cdda-schema";
import { app, IpcMainInvokeEvent } from "electron";
import path from "pathe";



export type GameDataTable = {
    Item:PRecord<string,AnyItem>;
    Terrain:PRecord<string,Terrain>;
    OvermapSpecial:PRecord<string,OverMapSpecial>;
    Mapgen:AnyMapgen[];
    Palette:PRecord<string,Palette>;
    Monster:PRecord<string,Monster>;
}


type AnyType = AnyCddaJson['type'];
function matchTypeProc<T extends AnyCddaJson,FMAP extends Partial<{
    [P in AnyType]:(json:Extract<T,{type:P}>)=>any
}>>(json:T,fmap:FMAP):{
    [P in AnyType]: FMAP[P] extends AnyFunc ? ReturnType<FMAP[P]> : undefined
}[AnyType]|undefined{
    const f = fmap[json.type];
    if(f) return f(json as any);
    return undefined;
}

async function loadJsonAndCache(gamePath:string){
    const approot = app==undefined ? process.cwd() : app.getAppPath();
    const cachePath = path.join(approot,'cache','gamedata.json');
    if(await UtilFT.pathExists(cachePath))
        return [await UtilFT.loadJSONFile(cachePath)] as AnyCddaJson[]

    const baseJson = path.join(gamePath,'data','json');
    const baseFiles = await UtilFT.fileSearchRegex(baseJson,'.*\\.json');
    const baseJsons = await Promise.all(baseFiles.map(fp=>
        UtilFT.loadJSONFile(fp) as Promise<AnyCddaJson|AnyCddaJson[]>
    ));
    UtilFT.writeJSONFile(cachePath,baseJsons.reduce((acc:AnyCddaJson[],curr)=>{
        if(typeof curr != 'object') return acc;
        if(Array.isArray(curr)) return [...acc,...curr];
        return  [...acc,curr];
    },[]).filter(item=> ![
            'achievement','jmath_function',"harvest",
            'effect_on_condition','mission_definition',
            'item_group','activity_type',"effect_type",
            'construction','requirement',"profession",
            'recipe','talk_topic',"json_flag",
            'damage_type','tool_quality',
        ].includes(item.type)
    ));
    return baseJsons;
}


export async function loadGameData(e:IpcMainInvokeEvent|undefined,gamePath:string){
    const baseJsons = await loadJsonAndCache(gamePath);

    const out:GameDataTable = {
        Item:{},
        Terrain:{},
        OvermapSpecial:{},
        Mapgen:[],
        Palette:{},
        Monster:{}
    }

    //#region match
    const addItem = (item:AnyItem)=>out.Item[item.id] = item;
    const addAnyItem:{[P in AnyItem['type']]:typeof addItem}={
        'GENERIC':addItem,'AMMO':addItem,
        'ARMOR':addItem,'COMESTIBLE':addItem,
        'GUN':addItem,'GUNMOD':addItem,
        'MAGAZINE':addItem,'TOOL':addItem,
    }
    //#endregion

    for(const json of baseJsons){
        if(typeof json != 'object') continue;
        const fixJsonList = Array.isArray(json)
            ? json : [json];
        for(const data of fixJsonList){
            matchTypeProc(data,{
                ...addAnyItem,
                "terrain":t=>out.Terrain[t.id] = t,
                'overmap_special':t=>out.OvermapSpecial[t.id] = t,
                'mapgen':t=>out.Mapgen.push(t),
                'palette':t=>out.Palette[t.id] = t,
                'MONSTER':t=>out.Monster[t.id] = t,
            })
        }
    }
    return out;
}



if(false)(async()=>{
    console.time('load4');
    const d = await loadGameData(undefined,
        'H:/CDDA/cdda-windows-tiles-x64-2023-05-08-0608/'
    );
    console.log(d.Item['rock']);
    console.timeEnd('load4');
    console.log(111213)
})()