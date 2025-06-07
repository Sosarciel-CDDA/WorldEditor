import React, { createContext, useState, ReactNode } from 'react';
import { TilesetData } from '@/src/static/TilesetLoader';
import { GameDataTable } from '@/src/static/DataLoader';
import { PRecord } from '@zwa73/utils';






type SetContext<T> = React.Dispatch<React.SetStateAction<T | undefined>>;;
type Context<T> = T | undefined;
// 创建上下文
export const GlobalContext = createContext<{
    inited:Context<boolean>;
    setInited:SetContext<boolean>;
}>({} as any);

// 创建提供者组件
export const GlobalProvider = (({ children }: { children: ReactNode }) => {
    const [inited, setInited]           = useState<Context<boolean>>(undefined);

    return (
        <GlobalContext.Provider value={{
            inited, setInited,
        }}>
            {children}
        </GlobalContext.Provider>
    );
});

/**初始化数据 */
export const InitData: {
    tilesetData:TilesetData;
    gameDataTable:GameDataTable;
    i18NData:PRecord<string,string>;
} = {
    tilesetData:{info:{height:0,width:0},table:{}},
    gameDataTable:{
        Item:{},
        Mapgen:[],
        Monster:{},
        OvermapSpecial:{},
        Palette:{},
        Terrain:{},
        Furniture:{}
    },
    i18NData:{},
};

//(window as any).gvp={}
export const CHUNK_SIZE = {width:24,height:24};
