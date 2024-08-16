import { memo, useContext, useEffect, useState } from "react";
import { GlobalContext, GVar } from "@/src/compoent/GlobalContext";
import { Card } from '@zwa73/react-utils';
import { css } from "styled-components";



const tileTooltipStyled = css`
    padding: 10px; // 内边距为10px
    width:100%;
    white-space: pre-wrap; // 使用 pre-wrap 来保留空格和换行符
    word-wrap:break-word;
    background-color: transparent;
    &:hover{
        background-color: transparent;
    }
`;



export const TipsPanel = memo(((props:{})=>{
    const [text,setText] = useState('');

    const {I18NData,gameDataTable} = useContext(GlobalContext);

    useEffect(() => {
        console.log('TipsPanel useEffect')
        const interval = setInterval(() => {
            if(I18NData==null) return;
            const dat = GVar.currentTile?.getData();
            const pos = GVar.currentTile?.getPos()!;
            if(dat==null) {
                setText("None");
                return
            }
            const gameId = dat.terrain?.tileId;
            if(gameId==null) {
                setText("None");
                return
            }
            const gameDat = gameDataTable?.Terrain[gameId];
            if(gameDat==undefined) return;
            const name = typeof gameDat.name == 'string'
                ? gameDat.name
                : gameDat.name.str ?? gameDat.name.str_sp ?? gameDat.name.str_pl ?? gameDat.name.ctxt ?? "unnamed"
            const display =
                `id: ${gameDat.id}\n`+
                `name: ${name}\n`+
                `trans_name: ${I18NData[name]}\n`+
                `chunk: (${pos.chunkX},${pos.chunkY})\n`+
                `pos: (${pos.tileX},${pos.tileY})\n`;
            setText(display);
        }, 100); // 每100毫秒检查一次全局变量的变化

        return () => clearInterval(interval);
    }, [I18NData,gameDataTable]);
    console.log('rendering TipsPanel')

    return (<Card
        cardStyle={tileTooltipStyled}
    >{text}</Card>);
}));