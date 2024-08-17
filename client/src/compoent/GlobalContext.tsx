import React, { createContext, useState, ReactNode } from 'react';
import { TilesetData } from '@/src/static/TilesetLoader';
import { TileSlot, ZoneMap } from './TileMap';
import { GameDataTable } from '@/src/static/DataLoader';
import { PRecord } from '@zwa73/utils';
import { AnyMapgen, Mapgen } from 'cdda-schema';
import { MainPanel } from './MainPanel';
import * as PIXI from 'pixi.js';





// 创建上下文
export const GlobalContext = createContext<{
    tilesetData: TilesetData|undefined;
    setTilesetData: React.Dispatch<React.SetStateAction<TilesetData | undefined>>;
    gameDataTable: GameDataTable|undefined;
    setGameDataTable: React.Dispatch<React.SetStateAction<GameDataTable | undefined>>;
    I18NData: PRecord<string,string>|undefined;
    setI18NData: React.Dispatch<React.SetStateAction<PRecord<string,string> | undefined>>;
}>({} as any);

// 创建提供者组件
export const GlobalProvider = (({ children }: { children: ReactNode }) => {
    const [tilesetData, setTilesetData]           = useState<TilesetData|undefined>(undefined);
    const [gameDataTable, setGameDataTable]       = useState<GameDataTable|undefined>(undefined);
    const [I18NData, setI18NData]                 = useState<PRecord<string,string>|undefined>(undefined);

    return (
        <GlobalContext.Provider value={{
            tilesetData, setTilesetData,
            gameDataTable, setGameDataTable,
            I18NData, setI18NData,
        }}>
            {children}
        </GlobalContext.Provider>
    );
});

export const GVar:{
    currentTile?:TileSlot;
    brusnId?:string;
    omterrainIDMap?:PRecord<string,Mapgen>;
    /**主面板 */
    mainPanel?:MainPanel;
} = {};
//(window as any).gvp={}
export const CHUNK_SIZE = {width:24,height:24}
