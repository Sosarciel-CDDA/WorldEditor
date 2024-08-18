import { memo, useContext, useEffect, useState } from "react";
import { GlobalContext, InitData } from "@/src/compoent/GlobalContext";
import { Card } from '@zwa73/react-utils';
import { css } from "styled-components";
import { CanvasPanelRef } from "../CanvasPanel";



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

    const {inited} = useContext(GlobalContext);

    useEffect(() => {
        console.log('TipsPanel useEffect')
        if(inited!=true) return;
        const interval = setInterval(() => {
            const canvas = CanvasPanelRef.current;
            if(canvas==null) return;
            const {currentTile} = canvas.getData();
            const dat = currentTile?.getDataTable();
            const pos = currentTile?.getPos();
            if(dat==null || pos==null) {
                setText("None");
                return;
            }
            const gameId = dat.terrain?.tileId;
            if(gameId==null) {
                setText("None");
                return
            }
            const gameDat = InitData.gameDataTable.Terrain[gameId];
            if(gameDat==undefined) return;
            const name = typeof gameDat.name == 'string'
                ? gameDat.name
                : gameDat.name.str ?? gameDat.name.str_sp ?? gameDat.name.str_pl ?? gameDat.name.ctxt ?? "unnamed"
            const display =
                `id: ${gameDat.id}\n`+
                `name: ${name}\n`+
                `trans_name: ${InitData.i18NData[name]}\n`+
                `chunk: (${pos.chunkX},${pos.chunkY})\n`+
                `pos: (${pos.tileX},${pos.tileY})\n`;
            setText(display);
        }, 100); // 每100毫秒检查一次全局变量的变化

        return () => clearInterval(interval);
    }, [inited]);
    console.log('rendering TipsPanel')

    return (<Card
        cardStyle={tileTooltipStyled}
    >{text}</Card>);
}));