import React, { forwardRef, Ref, useContext, useEffect, useState } from "react";
import { GlobalContext, InitData } from "@/src/Frontend/GlobalContext";
import { Card } from '@zwa73/react-utils';
import { css } from "styled-components";
import { CanvasPanelRef } from "../../CanvasPanel";
import { DescText } from "@sosarciel-cdda/schema";
import { TileSlot } from "../../TileMap";



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

const getTextByDesc = (str:DescText)=>{
    return typeof str == 'string'
        ? str
        : str.str ?? str.str_sp ?? str.str_pl ?? str.ctxt ?? "unnamed";
};

export type MouseTips = {};

const _MouseTips = forwardRef(((props:{},ref:Ref<MouseTips>)=>{
    const [text,setText] = useState('');

    const {inited} = useContext(GlobalContext);

    useEffect(() => {
        console.log('TipsPanel useEffect');
        if(inited!=true) return;
        let preTile:TileSlot|null = null;
        const interval = setInterval(() => {
            const canvas = CanvasPanelRef.current;
            if(canvas==null) return;
            const {currentTile} = canvas.getData();
            const dat = currentTile?.getDataTable();
            const pos = currentTile?.getPos();
            if(dat==null || pos==null || currentTile==null) {
                setText("Out Chunk");
                return;
            }

            //半透明遮罩
            const isChange = preTile!=currentTile;
            if(preTile!=null && isChange) preTile.fadeOut();
            if(isChange) {
                preTile = currentTile;
                currentTile.fadeIn();
            }


            let displayText =
                `chunk: (${pos.chunkX},${pos.chunkY})\n`+
                `pos: (${pos.tileX},${pos.tileY})\n`;
            //地形
            (()=>{
                const gameId = dat.terrain?.tileId;
                if(gameId==null) return;
                const gameDat = InitData.gameDataTable.Terrain[gameId];
                if(gameDat==undefined) {
                    displayText += `terrain_id: ${gameId}\n`;
                    return;
                }
                const name = getTextByDesc(gameDat.name);
                displayText +=
                    `terrain_id: ${gameDat.id}\n`+
                    `terrain_name: ${name}\n`+
                    `terrain_trans_name: ${InitData.i18NData[name]}\n`;
            })();
            //家具
            (()=>{
                const gameId = dat.furniture?.tileId;
                if(gameId==null) return;
                const gameDat = InitData.gameDataTable.Furniture[gameId];
                if(gameDat==undefined) {
                    displayText += `furniture_id: ${gameId}\n`;
                    return;
                }
                const name = getTextByDesc(gameDat.name);
                displayText +=
                    `furniture_id: ${gameDat.id}\n`+
                    `furniture_name: ${name}\n`+
                    `furniture_trans_name: ${InitData.i18NData[name]}\n`;
            })();
            setText(displayText.trim());
        }, 100); // 每100毫秒检查一次全局变量的变化

        return () => clearInterval(interval);
    }, [inited]);
    console.log('rendering TipsPanel');

    return (<Card
        cardStyle={tileTooltipStyled}
    >{text}</Card>);
}));

export const {MouseTipsDom,MouseTipsRef} = (()=>{
    const ref = React.createRef<MouseTips>();
    return{
        MouseTipsDom:<_MouseTips ref={ref}/>,
        MouseTipsRef:ref,
    };
})();
